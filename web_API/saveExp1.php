<?php
ini_set('display_errors', 1); // debugging

$post_data = json_decode(file_get_contents('php://input'), true); 
// the directory "data" must be writable by the server
//print_r($post_data);
echo $post_data;
$id = $post_data['prolific_id'];
$save_data = $post_data['data'];
$name = "../data/".$id."_exp1.csv"; 
// write the file to disk
file_put_contents($name, $save_data);
// sleep(10);
file_put_contents("log.txt", "test");
$pythonstuff = shell_exec("/usr/lib/python-virtualenvs/rewad/bin/python /var/www/clox/rewad2/rewad2_server/web_API/input_output_B08optimize.py $id");
//echo $pythonstuff;
?>