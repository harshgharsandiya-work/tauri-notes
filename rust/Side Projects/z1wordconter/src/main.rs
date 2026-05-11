use std::fs;

fn main() {
    println!("##Word Counter##\n");


    //read data from file
    let data = fs::read_to_string("data.txt")
                .expect("Unable to read file");
    println!("Data is : \n\n{data}");

    //count words from data
    let count = word_count(&data);

    //print word count in console
    println!("Word count: {count}");

}

fn word_count (s : &str) -> usize {
    let mut count = 0;
    let mut inside_word = false;

    for c in s.chars() {
        if c.is_ascii_whitespace() {
            if inside_word {
                count += 1;
                inside_word = false;
            }
        }
        else {
            inside_word = true;
        }
    }

    if inside_word {
        count += 1;
    }

    count
}
