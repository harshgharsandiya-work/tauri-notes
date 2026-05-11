fn main() {
    // let condition = true;

    // let x = if condition { 5 } else { 6 };

    // println!("x = {x}");

    // loop_fn();

    // loop_label();

    // while_loop();

    for_loop();
}

// fn loop_fn() {
//     let mut counter = 0;
//     let result = loop {
//         counter += 1;

//         if counter == 10 {
//             break counter * 2;
//         }
//     };

//     println!("The result is {result}");
// }

// fn loop_label() {
//     let mut count = 0;
//     'counting_up: loop {
//         println!("{count}");

//         let mut remain = 10;

//         loop {
//             println!("{remain}");
//             if remain == 9 {
//                 break;
//             }
//             if count == 2 {
//                 break 'counting_up;
//             }
//             remain -= 1;
//         }
//         count += 1;
//     }

//     println!("End count = {count}");
// }

// fn while_loop() {
//     let mut number = 3;

//     while number != 0 {
//         println!("{number}!");

//         number -= 1;
//     }

//     println!("LIFTOFF!!!");
// }

fn for_loop() {
    // let a = [10, 20, 30, 40];

    // for ele in a {
    //     println!("{ele}");
    // }


    for number in (1..4).rev() {
        println!("{number}");
    }
}