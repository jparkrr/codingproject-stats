#!/usr/local/bin/php
<?php
$db=mysql_connect('#######', '########', '#######') or die('Could not connect');
mysql_select_db('seniorproject', $db) or die('');
if (isset($_GET['yearly'])) {
	if ($_GET['yearly'] == "lang") {
		$query = "select language.name, semester, year, count(*) "
			."from apply_language, apply, language, student "
			."where apply_language.apply_id = apply.id "
			."AND student.id = apply.user_id "
			."AND apply_language.language_id = language.id "
			."group by language.name, semester, year "
			."order by year, semester";
		}
	else {
		$query = "select package.name, semester, year, count(*) "
			."from apply_package, apply, package, student "
			."where apply_package.apply_id = apply.id "
			."AND student.id = apply.user_id "
			."AND apply_package.package_id = package.id "
			."group by package.name, semester, year "
			."order by year, semester";
	}
	$result = mysql_query($query);
	$array = array();
	while($r = mysql_fetch_array($result, MYSQL_NUM)) {
		if ($r[1] == "Fall")
			$month = 8;
		else $month = 1;
		$date = $r[2].'-'.$month.'-1';
		$array[$r[0]][] = array($date, intval($r[3]));
	}
	print json_encode($array);
}

elseif (isset($_GET['advisors'])) {
	$res = json_decode(stripslashes($_POST['data']), true);
	$query = "select distinct first_name, last_name "
				."from apply, advises, user, student "
				."where apply.id=application_id ";
	if (sizeof($res['avl'])>0) {
	$query 		.="and year in (".implode(',',$res['avl']).") ";
			}
	if (sizeof($res['sel'])>0) {
	$query		.="and semester in ('".implode("','",$res['sel'])."') ";
			}
	$query     .="and user.id=advises.user_id "
				."AND student.id = apply.user_id "
				."order by last_name";
	$result = mysql_query($query);
	if (!$result) {
 	   die('Invalid query: ' . $query);
	}
	$rows = array();
	$first = true;
	print '[';
	while($r = mysql_fetch_array($result, MYSQL_NUM)) {
	    if ($first) {
	        $first = false;
	    }
	    else {
	        print ", ";
	    }
	    printf('"%s %s"',$r[0],$r[1]);
	}
	echo "]";
}
elseif (isset($_GET['pie'])) {
	$res = json_decode(stripslashes($_POST['data']), true);

	if($_GET['pie']=='lang') {
		$return = "select CONCAT(language.name,' (',count(*),')') as name";
		if (isset($_GET['second'])) {
			$return = "select language.name as name";
		}
		$query = $return . ", count(*) "
		."from apply, user as suser, student, language, apply_language, advises, user as auser "
		."where apply.id = apply_language.apply_id "
		."and apply_language.language_id = language.id "
		."and apply.user_id = suser.id "
		."and suser.id = student.id "
		."and advises.application_id = apply.id "
		."and advises.user_id = auser.id ";
	}
	else {
		$return = "select CONCAT(package.name,' (',count(*),')') as name";
		if (isset($_GET['second'])) {
			$return = "select package.name as name";
		}
		$query = $return . ", count(*) "
		."from apply, user as suser, student, package, apply_package, advises, user as auser "
		."where apply.id = apply_package.apply_id "
		."and apply_package.package_id = package.id "
		."and apply.user_id = suser.id "
		."and suser.id = student.id "
		."and advises.application_id = apply.id "
		."and advises.user_id = auser.id ";
	}
	if (sizeof($res['years'])>0) {
	$query .="and year in (".implode(',',$res['years']).") ";
			}
	if (sizeof($res['semesters'])>0) {
	$query.="and semester in ('".implode("','",$res['semesters'])."') ";
			}
	if ($res['advisor']!="All advisors") {
	$query.="and concat_ws(' ',auser.first_name,auser.last_name)  =  '".$res['advisor']."' ";
			}
	if($_GET['pie']=='lang') {
		$query.="group by language.name "
		."order by language.name";
	}
	else {
		$query.="group by package.name "
		."order by package.name";
	}
	$result = mysql_query($query);
	if (!$result) {
 	   die('Error: '.mysql_error() .'<br>Invalid query: ' . $query);
	}
	$array = array();
	while($r = mysql_fetch_array($result, MYSQL_NUM)) {
		$array[$r[0]] = intval($r[1]);
	}
	print json_encode($array);
}
else {
	echo "[";

	$result = mysql_query("SELECT distinct year from student order by year") or die('Could not query');
	$rows = array();
	$first = true;
	while($r = mysql_fetch_array($result, MYSQL_NUM)) {
	    if ($first) {
	        $first = false;
	    }
	    else {
	        print ", ";
	    }
	    printf('"%s"',$r[0]);
	}
	echo "]";
}

mysql_close($db);
?>