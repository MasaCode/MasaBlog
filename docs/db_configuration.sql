CREATE TABLE `masa_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

INSERT INTO `masa_admins` (`username`, `password`, `is_active`) VALUES
( 'masablog', '$2a$10$GP1qV10f7FV4c.W3xSMM1ejE.88GrEs5u.k7tnIBtq0tsGGUrk..i', 1);

CREATE TABLE `masa_thumbnails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `is_active` tinyint(11) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_date` datetime NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `sequence` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`)
  REFERENCES `masa_admins` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_post_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `body` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post_id`)
  REFERENCES `masa_posts` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `comments` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post_id`)
  REFERENCES `masa_posts` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_relation_post_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post_id`)
  REFERENCES `masa_posts` (`id`),
  FOREIGN KEY (`category_id`)
  REFERENCES `masa_categories` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_relation_post_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post_id`)
  REFERENCES `masa_posts` (`id`),
  FOREIGN KEY (`tag_id`)
  REFERENCES `masa_tags` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_relation_category_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`)
  REFERENCES `masa_categories` (`id`),
  FOREIGN KEY (`tag_id`)
  REFERENCES `masa_tags` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;