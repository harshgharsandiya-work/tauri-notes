struct User {
    active: bool,
    username: String,
    email: String,
    phone: String,
    sign_in_count: u64,
}

fn build_user(username: String, email: String) -> User {
    User {
        active: true,
        username,
        email,
        phone: String::from("1234567890"),
        sign_in_count: 1,
    }
}

//tuple Struct 
struct Color(i32, i32, i32);
struct Point(i16, i16);

//unit like struct
struct AlwaysEqual;

fn main() {
    let user1 = User {
        active: false, 
        email: String::from("demo@demo.com"),
        username: String::from("demo"),
        sign_in_count: 55,
        phone: String::from("1234567890")
    };
    println!("User 1  --- {}", user1.phone);

    let mut user2 = build_user(String::from("demo2"), String::from("demo2@demo.com"));

    println!("User2 -- Email -- {}", user2.email);
    
    println!("User2 -- Active -- {}", user2.active);
    user2.active = false;
    println!("User2 -- Active -- {}", user2.active);



    // let user3 = User {
    //     email: String::from("another@demo.com"),
    //     active: user1.active,
    //     username: user1.username,
    //     sign_in_count: user1.sign_in_count,
    //     phone: user1.phone,
    // }; 
    let user3 = User {
        email: String::from("another@demo.com"),
        ..user1
    };

    println!("User 3  --- {}", user3.email);
    println!("User 3  --- {}", user3.active);
    println!("User 3  --- {}", user3.username);
    println!("User 3  --- {}", user3.sign_in_count);
    println!("User 3  --- {}", user3.phone);


    //valid
    println!("{}", user1.email);
    println!("User 1  --- {}", user1.active);

    let black = Color(0, 0, 0);
    let origin = Point(0, 0);

    let Color(r, g, b) = black;

    println!("{r}:{g}:{b}");

}
