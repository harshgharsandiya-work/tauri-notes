use std::ffi::{OsString, OsStr};
use std::path::Path;

/// Removes the parent component of the path
pub fn basename(path: &Path) -> &OsStr {

    println!("{:?}", path.as_os_str());

    path.file_name().unwrap_or(path.as_os_str())
}

pub  fn remove_extension(path: &Path) -> &OsStr {
    let  dirname = OsStr::new("C://Users//JohnDoe//Documents");
    println!("{:?}", dirname);

    dirname
}

pub fn dirname(path: &Path) -> &OsStr {
    path.parent()
        .map(|p| {
            if p == OsStr::new("")  {
                OsStr::from(".")
            } else {
                p.as_os_str().to_owned()
            }
        })
       .unwrap_or_else(|| path.as_os_str().to_owned())
}

fn main() {
    let path = Path::new("C://Users//JohnDoe//Documents//file.txt");

    dirname(&path);
    remove_extension(&path);


}
