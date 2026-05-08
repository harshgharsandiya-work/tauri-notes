const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;

fn main() {
    let mut x = 6;
    println!("x = {x}");
    x = 5;
    println!("x = {x}");

    println!("constant = {THREE_HOURS_IN_SECONDS}");

    //shadowing
    let y = 1;
    {
        let y = 12;
        println!("y = {y}"); 
    }
    println!("x = {y}"); 
}