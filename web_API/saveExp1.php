<?php
// change paths according to system
// paths linux:
// $pypath = "/usr/lib/python-virtualenvs/rewad/bin/python";
// $scriptpath = "/var/www/clox/rewad2/rewad2_server/web_API/input_output_B08optimize.py";

// paths windows (absolute paths are better):
$pypath = "python";
$scriptpath = "input_output_B08optimize.py";

// debugging: if needed, remove redirect in jspych_experiment1 to display PHP errors
ini_set('display_errors', 1);

// decode data from HTTP request
$post_data = json_decode(file_get_contents('php://input'), true);
echo $post_data;

// extract ID and JSPsych data
$id = $post_data['prolific_id'];
$save_data = $post_data['data'];

// the directory "data" must be writable by the www-data user!
// path to directory
$name = "../data/".$id."_exp1.csv";

// write the file to disk
file_put_contents($name, $save_data);

// execute python script: file must be executable by the www-data user!
$pythonstuff = shell_exec("$pypath $scriptpath $id");
echo $pythonstuff;
?>