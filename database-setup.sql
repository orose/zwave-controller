--drop table nodevalues;

create table nodevalues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  node_id varchar(10) not null,
  label varchar(255) not null,
  new_value varchar(255) not null,
  old_value varchar(255) not null,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  
);
