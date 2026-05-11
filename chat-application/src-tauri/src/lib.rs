//! Chat backend — Postgres-backed Tauri commands.

use r2d2::Pool;
use r2d2_postgres::{postgres::NoTls, PostgresConnectionManager};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

// ──────────────────────────────────────────
// Connection pool
// ──────────────────────────────────────────

type DbPool = Pool<PostgresConnectionManager<NoTls>>;

pub struct AppState {
    pub pool: DbPool,
}

fn make_pool() -> DbPool {
    let manager = PostgresConnectionManager::new(
        "host=localhost user=postgres password=admin123 dbname=chat_app_with_tauri"
            .parse()
            .expect("invalid connection string"),
        NoTls,
    );
    // min_idle(Some(0)) — do NOT create connections eagerly at startup.
    // Without this, r2d2 tries to open `max_size` connections immediately,
    // which panics before the Tauri window is even created if Postgres is
    // unavailable.  With lazy connections the pool always builds successfully
    // and individual commands return a meaningful Err instead of crashing.
    Pool::builder()
        .max_size(10)
        .min_idle(Some(0))
        .build(manager)
        .expect("failed to configure connection pool")
}

/// Attempt to create all tables.  Returns an error string instead of
/// panicking so the Tauri window is always created even when Postgres is
/// temporarily unavailable — individual commands will then surface the
/// proper connection error to the user.
fn init_db(pool: &DbPool) -> Result<(), String> {
    let mut client = pool.get().map_err(|e| e.to_string())?;
    client
        .batch_execute(
            "
            CREATE TABLE IF NOT EXISTS users (
                id   TEXT PRIMARY KEY,
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS rooms (
                id         TEXT PRIMARY KEY,
                name       TEXT    NOT NULL,
                is_private BOOLEAN NOT NULL,
                code       TEXT,
                owner_id   TEXT REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS room_members (
                room_id TEXT REFERENCES rooms(id),
                user_id TEXT REFERENCES users(id),
                PRIMARY KEY (room_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id           TEXT PRIMARY KEY,
                room_id      TEXT REFERENCES rooms(id),
                sender_id    TEXT REFERENCES users(id) NOT NULL,
                recipient_id TEXT REFERENCES users(id),
                content      TEXT NOT NULL,
                created_at   TEXT NOT NULL
            );
            ",
        )
        .map_err(|e| e.to_string())?;

    client
        .batch_execute(
            "
            ALTER TABLE rooms
            ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);
            ",
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ──────────────────────────────────────────
// Random username generator (no extra crate)
// ──────────────────────────────────────────

const ADJECTIVES: &[&str] = &[
    "Happy", "Silly", "Brave", "Clever", "Swift", "Mighty", "Calm", "Bold",
    "Witty", "Kind", "Cool", "Wild", "Fierce", "Proud", "Jolly", "Lucky",
    "Shiny", "Speedy", "Quiet", "Fancy",
];

const ANIMALS: &[&str] = &[
    "Fox", "Bear", "Wolf", "Eagle", "Lion", "Tiger", "Panda", "Falcon",
    "Hawk", "Otter", "Lynx", "Deer", "Raven", "Cobra", "Gecko",
    "Viper", "Moose", "Bison", "Crane", "Shark",
];

fn generate_username(id: &Uuid) -> String {
    let b = id.as_bytes();
    let adj    = ADJECTIVES[(b[0] as usize) % ADJECTIVES.len()];
    let animal = ANIMALS[(b[1] as usize) % ANIMALS.len()];
    let num    = (((b[2] as u16) << 4) | ((b[3] as u16) & 0xF)) % 100;
    format!("{}{}{}", adj, animal, num)
}

// ──────────────────────────────────────────
// Shared data types
// ──────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id:   String,
    pub name: String,
}

#[derive(Serialize, Clone)]
pub struct Room {
    pub id:         String,
    pub name:       String,
    pub is_private: bool,
    pub owner_id:   Option<String>,
}

/// Room with membership flag (used by browse-rooms list).
#[derive(Serialize, Clone)]
pub struct RoomInfo {
    pub id:         String,
    pub name:       String,
    pub is_private: bool,
    pub is_member:  bool,
}

#[derive(Serialize)]
pub struct Message {
    pub id:           String,
    pub room_id:      Option<String>,
    pub sender_id:    String,
    pub sender_name:  String,
    pub recipient_id: Option<String>,
    pub content:      String,
    pub created_at:   String,
}

// ──────────────────────────────────────────
// User commands
// ──────────────────────────────────────────

/// Create a new anonymous user for this session.
#[tauri::command]
fn init_user(state: State<'_, AppState>) -> Result<User, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let id      = Uuid::new_v4();
    let id_str  = id.to_string();
    let name    = generate_username(&id);
    client
        .execute(
            "INSERT INTO users (id, name) VALUES ($1, $2)",
            &[&id_str, &name],
        )
        .map_err(|e| e.to_string())?;
    Ok(User { id: id_str, name })
}

/// Update the display name of an existing user.
#[tauri::command]
fn rename_user(
    state:    State<'_, AppState>,
    user_id:  &str,
    new_name: &str,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    client
        .execute(
            "UPDATE users SET name = $1 WHERE id = $2",
            &[&new_name, &user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Search users by name (excludes the requesting user).
#[tauri::command]
fn search_users(
    state:           State<'_, AppState>,
    query:           &str,
    current_user_id: &str,
) -> Result<Vec<User>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let like = format!("%{}%", query);
    let rows = client
        .query(
            "SELECT id, name FROM users \
             WHERE name ILIKE $1 AND id != $2 \
             ORDER BY name LIMIT 20",
            &[&like, &current_user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| User { id: r.get(0), name: r.get(1) })
        .collect())
}

/// Return every user except the caller (used for browsing people to DM).
#[tauri::command]
fn list_users(
    state:           State<'_, AppState>,
    current_user_id: &str,
) -> Result<Vec<User>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT id, name FROM users WHERE id != $1 ORDER BY name",
            &[&current_user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| User { id: r.get(0), name: r.get(1) })
        .collect())
}

// ──────────────────────────────────────────
// Room commands
// ──────────────────────────────────────────

/// Create a room and automatically make the creator a member.
#[tauri::command]
fn create_room(
    state:      State<'_, AppState>,
    name:       &str,
    is_private: bool,
    code:       Option<String>,
    creator_id: &str,
) -> Result<Room, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rid = Uuid::new_v4().to_string();
    client
        .execute(
            "INSERT INTO rooms (id, name, is_private, code, owner_id) VALUES ($1, $2, $3, $4, $5)",
            &[&rid, &name, &is_private, &code, &creator_id],
        )
        .map_err(|e| e.to_string())?;
    client
        .execute(
            "INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)",
            &[&rid, &creator_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(Room {
        id: rid,
        name: name.to_string(),
        is_private,
        owner_id: Some(creator_id.to_string()),
    })
}

/// Delete a room created by the caller.
#[tauri::command]
fn delete_room(
    state:   State<'_, AppState>,
    room_id: &str,
    user_id: &str,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let mut tx = client.transaction().map_err(|e| e.to_string())?;

    let row = tx
        .query_opt(
            "SELECT owner_id FROM rooms WHERE id = $1",
            &[&room_id],
        )
        .map_err(|e| e.to_string())?;

    let Some(row) = row else {
        return Err("Room not found".into());
    };

    let owner_id: Option<String> = row.get(0);
    if owner_id.as_deref() != Some(user_id) {
        return Err("Only the creator can delete this room".into());
    }

    tx.execute(
        "DELETE FROM messages WHERE room_id = $1",
        &[&room_id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM room_members WHERE room_id = $1",
        &[&room_id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM rooms WHERE id = $1", &[&room_id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Leave a room (remove membership). If the leaving user is the owner,
/// the room's owner_id is cleared so ownership becomes empty.
#[tauri::command]
fn leave_room(
    state:   State<'_, AppState>,
    room_id: &str,
    user_id: &str,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let mut tx = client.transaction().map_err(|e| e.to_string())?;

    let row = tx
        .query_opt(
            "SELECT owner_id FROM rooms WHERE id = $1",
            &[&room_id],
        )
        .map_err(|e| e.to_string())?;

    let Some(row) = row else {
        return Err("Room not found".into());
    };

    let owner_id: Option<String> = row.get(0);
    if owner_id.as_deref() == Some(user_id) {
        tx.execute(
            "UPDATE rooms SET owner_id = NULL WHERE id = $1",
            &[&room_id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute(
        "DELETE FROM room_members WHERE room_id = $1 AND user_id = $2",
        &[&room_id, &user_id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Join a room; validates the code for private rooms.
#[tauri::command]
fn join_room(
    state:   State<'_, AppState>,
    user_id: &str,
    room_id: &str,
    code:    Option<String>,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let row = client
        .query_one(
            "SELECT is_private, code FROM rooms WHERE id = $1",
            &[&room_id],
        )
        .map_err(|e| e.to_string())?;
    let is_private: bool          = row.get(0);
    let expected:   Option<String> = row.get(1);
    if is_private && (expected.is_none() || expected != code) {
        return Err("Invalid room code".into());
    }
    client
        .execute(
            "INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            &[&room_id, &user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Rooms the user has already joined.
#[tauri::command]
fn list_my_rooms(
    state:   State<'_, AppState>,
    user_id: &str,
) -> Result<Vec<Room>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT r.id, r.name, r.is_private, r.owner_id \
             FROM rooms r \
             JOIN room_members rm ON r.id = rm.room_id \
             WHERE rm.user_id = $1 \
             ORDER BY r.name",
            &[&user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| Room {
            id: r.get(0),
            name: r.get(1),
            is_private: r.get(2),
            owner_id: r.get(3),
        })
        .collect())
}

/// All rooms with a flag indicating whether the user is a member.
#[tauri::command]
fn list_all_rooms(
    state:   State<'_, AppState>,
    user_id: &str,
) -> Result<Vec<RoomInfo>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT r.id, r.name, r.is_private, \
                    EXISTS( \
                        SELECT 1 FROM room_members rm \
                        WHERE rm.room_id = r.id AND rm.user_id = $1 \
                    ) AS is_member \
             FROM rooms r \
             ORDER BY r.name",
            &[&user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| RoomInfo {
            id:         r.get(0),
            name:       r.get(1),
            is_private: r.get(2),
            is_member:  r.get(3),
        })
        .collect())
}

// ──────────────────────────────────────────
// Message commands
// ──────────────────────────────────────────

/// Post a message to a room.
#[tauri::command]
fn send_message_room(
    state:     State<'_, AppState>,
    room_id:   &str,
    sender_id: &str,
    content:   &str,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let mid = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    client
        .execute(
            "INSERT INTO messages (id, room_id, sender_id, recipient_id, content, created_at) \
             VALUES ($1, $2, $3, NULL, $4, $5)",
            &[&mid, &room_id, &sender_id, &content, &now],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Send a direct message between two users.
#[tauri::command]
fn send_message_user(
    state:        State<'_, AppState>,
    sender_id:    &str,
    recipient_id: &str,
    content:      &str,
) -> Result<(), String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let mid = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    client
        .execute(
            "INSERT INTO messages (id, room_id, sender_id, recipient_id, content, created_at) \
             VALUES ($1, NULL, $2, $3, $4, $5)",
            &[&mid, &sender_id, &recipient_id, &content, &now],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// All messages in a room, ordered by time.
#[tauri::command]
fn list_messages_room(
    state:   State<'_, AppState>,
    room_id: &str,
) -> Result<Vec<Message>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT m.id, m.room_id, m.sender_id, u.name, m.recipient_id, m.content, m.created_at \
             FROM messages m \
             JOIN users u ON m.sender_id = u.id \
             WHERE m.room_id = $1 \
             ORDER BY m.created_at",
            &[&room_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| Message {
            id:           r.get(0),
            room_id:      r.get(1),
            sender_id:    r.get(2),
            sender_name:  r.get(3),
            recipient_id: r.get(4),
            content:      r.get(5),
            created_at:   r.get(6),
        })
        .collect())
}

/// All DM messages between two users, ordered by time.
#[tauri::command]
fn list_messages_between(
    state:  State<'_, AppState>,
    user_a: &str,
    user_b: &str,
) -> Result<Vec<Message>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT m.id, m.room_id, m.sender_id, u.name, m.recipient_id, m.content, m.created_at \
             FROM messages m \
             JOIN users u ON m.sender_id = u.id \
             WHERE (m.sender_id = $1 AND m.recipient_id = $2) \
                OR (m.sender_id = $2 AND m.recipient_id = $1) \
             ORDER BY m.created_at",
            &[&user_a, &user_b],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| Message {
            id:           r.get(0),
            room_id:      r.get(1),
            sender_id:    r.get(2),
            sender_name:  r.get(3),
            recipient_id: r.get(4),
            content:      r.get(5),
            created_at:   r.get(6),
        })
        .collect())
}

/// Users the caller has exchanged direct messages with.
#[tauri::command]
fn list_dm_partners(
    state:   State<'_, AppState>,
    user_id: &str,
) -> Result<Vec<User>, String> {
    let mut client = state.pool.get().map_err(|e| e.to_string())?;
    let rows = client
        .query(
            "SELECT DISTINCT u.id, u.name \
             FROM users u \
             WHERE u.id IN ( \
                 SELECT recipient_id FROM messages \
                 WHERE sender_id = $1 AND room_id IS NULL AND recipient_id IS NOT NULL \
                 UNION \
                 SELECT sender_id FROM messages \
                 WHERE recipient_id = $1 AND room_id IS NULL \
             ) \
             ORDER BY u.name",
            &[&user_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(rows
        .into_iter()
        .map(|r| User { id: r.get(0), name: r.get(1) })
        .collect())
}

// ──────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pool = make_pool();

    // Non-fatal: if Postgres is not reachable yet, the app window still opens
    // and every invoke command will return a clear connection-error string.
    if let Err(e) = init_db(&pool) {
        eprintln!("[ChatApp] DB init warning (app will still start): {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { pool })
        .invoke_handler(tauri::generate_handler![
            init_user,
            rename_user,
            search_users,
            list_users,
            create_room,
            delete_room,
            leave_room,
            join_room,
            list_my_rooms,
            list_all_rooms,
            send_message_room,
            send_message_user,
            list_messages_room,
            list_messages_between,
            list_dm_partners,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
