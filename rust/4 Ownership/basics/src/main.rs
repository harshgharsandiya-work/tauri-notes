fn main() {
    // let mut s = String::from("hello");
    // s.push_str(", world");
    // println!("{s}");

    // let s1 = String::from("hello");
    // let s2 = s1;

    // println!("{s2}");

    // let s1 = String::from("hello");
    // let s2 = s1.clone();

    // println!("s1 = {s1}, s2 = {s2}");

    // let x = 5;
    // let y = x;

    // println!("x = {x}, y = {y}");

    // let s = String::from("hello");
    // some_fn(s);
    // println!("{s}"); --> produce error


    // let mut s1 = String::from("hello");
    // let l = calculate_len(&s1);

    // println!("len of {s1} = {l}");

    // modify_s(&mut s1);

    // println!("s1 = {s1}");
    // {
    //     let r2 = &mut s1;
    // }

    // let r1 = &mut s1;

    // println!("{r1}");

    
    // let r1 = dangling_reference();

    let mut s = String::from("hello world");

    // let word = first_world(&s);

    // s.clear();

    // println!("{word}");

    let hello = &s[0..5];
    let world = &s[6..11];


}

// fn some_fn(some_string : String) {
//     println!("{some_string}");
// }

// fn calculate_len(s : &String) -> usize {
//     s.len()
// }

// fn modify_s(s: &mut String) {
//     s.push_str(", world")
// }

// fn dangling_reference() -> &String {
//     let s = String::from("hello");

//     &s
// }


/*
Write a function that takes a string of words separated by spaces and returns the first word it finds in that string. If the function doesn’t find a space in the string, the whole string must be one word, so the entire string should be returned.
*/

// fn first_world(s: &String) -> usize {
//     let bytes = s.as_bytes();

//     for (i, &item) in bytes.iter().enumerate() {
//         if item == b' ' {
//             return i;
//         }
//     }

//     s.len()
// }

fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
