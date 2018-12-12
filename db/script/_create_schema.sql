CREATE SCHEMA `common_iam` ;
CREATE USER 'biz'@'localhost' IDENTIFIED BY 'wise';

GRANT ALL privileges ON common_iam.* TO 'biz'@'%'IDENTIFIED BY 'wise';