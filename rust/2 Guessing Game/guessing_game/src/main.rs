use std::io;
use rand::Rng;
use std::cmp::Ordering;

fn main() {
    
    let secret_num = rand::thread_rng().gen_range(1..=1000);
    
    
    loop {
        let mut guess = String::new();

        println!("Enter guess number: ");
    
        io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");
        
        let guess : u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };
    
        match guess.cmp(&secret_num) {
            Ordering::Less => println!("Too small..."),
            Ordering::Greater => println!("Too big..."),
            Ordering::Equal => {
                println!("win!!!");
                break;
            },
        }
    }
}