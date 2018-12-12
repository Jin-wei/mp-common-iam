DROP TABLE IF EXISTS `user_info`;
DROP TABLE IF EXISTS `user_type`;
DROP TABLE IF EXISTS `user_token`;
DROP TABLE IF EXISTS `user_role`;
DROP TABLE IF EXISTS `role_permission`;
DROP TABLE IF EXISTS `role`;
DROP TABLE IF EXISTS `permission`;
DROP TABLE IF EXISTS `tenant`;

CREATE TABLE `tenant` (
  `tenant` varchar(32) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE tenant ADD COLUMN deleted_flag tinyint NOT NULL DEFAULT '0';

CREATE TABLE `user_type` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_type_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `user_token` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `device_type` int NOT NULL,
  `user_id` bigint(11) NOT NULL,
  `token` varchar(5000) DEFAULT NULL,
  `issue_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `expire_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
   CONSTRAINT `user_token_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



CREATE TABLE `permission` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `description` varchar(500) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `permission_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE permission ADD UNIQUE (tenant,name);

ALTER TABLE permission ADD COLUMN system_flag tinyint NOT NULL DEFAULT '0';


CREATE TABLE `role` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `name` varchar(32) NOT NULL,
  `description` varchar(500) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `role_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE role ADD UNIQUE (tenant,name);

ALTER TABLE role ADD COLUMN system_flag tinyint NOT NULL DEFAULT '0';



CREATE TABLE `user_info` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `biz_id` bigint(11) DEFAULT NULL,
  `biz_name` varchar(200) DEFAULT NULL,
  `tenant` varchar(32) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  `gender` tinyint(1) NOT NULL DEFAULT '1',
  `avatar` varchar(200) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `state` varchar(20) DEFAULT NULL,
  `city` varchar(40) DEFAULT NULL,
  `zipcode` varchar(32) DEFAULT NULL,
  `wechat_id` varchar(60) DEFAULT NULL,
  `wechat_status` tinyint(1) DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(60) NOT NULL DEFAULT "user",
  `att1_string` varchar(250),
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
   CONSTRAINT `user_info_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE user_info ADD column `created_by` bigint(11) DEFAULT NULL;
ALTER TABLE user_info ADD column `updated_by` bigint(11) DEFAULT NULL;
ALTER TABLE user_info ADD column `ssn` varchar(50) DEFAULT NULL;
ALTER TABLE user_info ADD column `att2_string` varchar(250) DEFAULT NULL;
ALTER TABLE user_info ADD column `att3_string` varchar(250) DEFAULT NULL;
ALTER TABLE user_info ADD COLUMN deleted_flag tinyint NOT NULL DEFAULT '0';

ALTER TABLE user_info ADD UNIQUE (tenant,phone);
ALTER TABLE user_info ADD UNIQUE (tenant,username);
ALTER TABLE user_info ADD UNIQUE (tenant,wechat_id);
ALTER TABLE user_info ADD UNIQUE (tenant,ssn);
ALTER TABLE user_info ADD UNIQUE (tenant,email);


CREATE TABLE `user_role` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `user_id` bigint(11) NOT NULL,
  `role_id` bigint(11) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_role_user_id` FOREIGN KEY (`user_id`) REFERENCES `user_info` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_role_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE user_role ADD UNIQUE (tenant,user_id,role_id);


CREATE TABLE `role_permission` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `permission_id` bigint(11) NOT NULL,
  `role_id` bigint(11) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `role_permission_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `role_permission_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `role_permission_tenant` FOREIGN KEY (`tenant`) REFERENCES `tenant` (`tenant`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
ALTER TABLE role_permission ADD UNIQUE (tenant,permission_id,role_id);