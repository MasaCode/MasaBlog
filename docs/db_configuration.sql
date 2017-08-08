CREATE TABLE `masa_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `image_path` varchar(255) NULL,
  `location` varchar(255) NOT NULL,
  `weather_api` text NOT NULL,
  `gmail_credentials` varchar(255) NULL,
  `gmail_tokens` varchar(255) NULL
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

INSERT INTO `masa_admins` (`username`, `password`, `is_active`, `location`, `weather_api`) VALUES
( 'root', '$2a$10$ma45FOGkIpA1okd720b3ZOG.Okmk24eFIW2/uhRa24OpxnKbDYEdm', 1, 'Vancouver,CA', 'you need to initialize');

CREATE TABLE `masa_thumbnails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NULL,
  `icon` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `sequence` int(11) NOT NULL,
  `body` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`)
  REFERENCES `masa_admins` (`id`),
  FOREIGN KEY (`category_id`)
  REFERENCES `masa_categories` (`id`))
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

CREATE TABLE `masa_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY(`id`),
  FOREIGN KEY (`admin_id`)
  REFERENCES `masa_admins` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `all_day` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`)
  REFERENCES `masa_admins` (`id`))
ENGINE=InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `masa_post_tag` (
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