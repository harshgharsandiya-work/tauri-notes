
impl Rectangle {
    fn area(&self) -> u64 {
        self.width * self.height
    }

    fn width(&self) -> bool {
        self.width > 0
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }


    //associated functions
    fn square(size: u64) -> Self {
        Self {
            width: size, 
            height: size,
        }
    }
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

    println!("Area of rectangle : {}", rect1.area());

     if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }

    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };
    let rect4 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("Can rect1 hold rect2? {}", rect4.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect4.can_hold(&rect3));

    let sq = Rectangle::square(3);
}
