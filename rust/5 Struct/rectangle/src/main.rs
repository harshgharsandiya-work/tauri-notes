
// fn area(dimensions: (u64, u64)) -> u64 {
//     dimensions.0 * dimensions.1
// }
fn area(rectangle: &Rectangle) -> u64 {
    rectangle.width * rectangle.height
}

#[derive(Debug)]
struct Rectangle {
    width: u64,
    height: u64,
}

fn main() {
    let scale = 2;

    let rect1 = Rectangle {
        width: dbg!(2 * scale),
        height: 15
    };

    // println!("rect: {rect1:?}");
    // println!("rect: {rect1:#?}");
    dbg!(&rect1);

    println!("Area of rectangle : {}", area(&rect1));
}
