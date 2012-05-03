function initializeArray(obj, full) {
	var len = full.length;
	for (var i=0; i < len; i++) {
		obj.avl[i] = full[i];
		obj.sel[i] = false;
	}
}

function arrTuple() {
	this.avl = [];
	this.sel = [];
}

function sendInfo() {
	this.years = [];
	this.semesters = [];
	this.advisor = "All advisors";
}

function pieControl(container) {
	var This = this;
	var years = new arrTuple();
	var semesters = new arrTuple();
	initializeArray(semesters,['Fall','Spring']);
	var c = container;
	var quer = new arrTuple();

	//constructor to set up buttons with years and buttons
	//TODO: make this add the years and semesters div by itself
	$.getJSON('backend.php', function(data) {
		var yrs = [];
		$.each(data, function(key, val) {
			yrs.push(val);
		});
		// Set up the availible an selected years
		initializeArray(years,yrs);
		//Add a button for each year
		$(c).html('<p><div class="btn-group years" data-toggle="buttons-checkbox"></div></p>');
		for (var y in years.avl) {
			$(c + ' .years').append('<button class="btn">'+years.avl[y]+'</button>');
		}
		//Select latest year
		years.sel[years.sel.length-1] = true;
		//Add click handler to each button
		$(c + ' .years .btn').each(function(index) {
			$(this).click(function () {
				if (!$(this).hasClass('active'))
					years.sel[index] = true;
				else
					years.sel[index] = false;
				updateQuery();
			});
		});
		$(c).append('<p><div class="btn-group semesters" data-toggle="buttons-checkbox"></div></p>');
		for (var s in semesters.avl) {
			$(c + ' .semesters').append('<button class="btn">'+semesters.avl[s]+'</button>');
		}
		$(c + ' .tabs').button();
		semesters.sel[semesters.sel.length-1] = true;
		

		$(c + ' .semesters .btn').each(function(index) {
			$(this).click(function () {
				if (!$(this).hasClass('active'))
					semesters.sel[index] = true;
				else
					semesters.sel[index] = false;
				updateQuery();
			});
		});
		$(c).append('<div class="control"><select class="advisors span2"></select></div>').change(update);
		updateButtons();
		updateQuery();
	});

	// Function that updates the query variable based on what is in years.sel and semesters.sel
	// then calls updateAdvisorsAndProject
	// called by the constructor and the clickhandler for the year and semester buttons
	function updateQuery() {
		quer.avl.length=0;
		quer.sel.length=0;
		for (var y in years.sel) {
			if(years.sel[y]) {
				quer.avl.push(years.avl[y]);
			}
		}
		for (var s in semesters.sel) {
			if(semesters.sel[s]) {
				quer.sel.push(semesters.avl[s]);
			}
		}
		updateAdvisorsAndProjects();
	}

	// Calls the server to get an updated list of advisors that match the current query
	// then calls populate select with the advisors and context pointer
	// called by updatequery and constructor
	function updateAdvisorsAndProjects () {
		var dataString = JSON.stringify(quer);
		$.post('backend.php?advisors', { data: dataString}, function (data) {
			var obj = $.parseJSON(data);
			var advisors = new arrTuple();
			initializeArray(advisors,obj);
			populateSelect($(c + ' .advisors'),advisors,"advisors");
		}, "text");
	}

	// looks at the years and semesters variables and sets the appropriate buttons
	// called by constructor after setting the last sem/yr to be active by default
	function updateButtons() {
		for (var y in years.sel) {
			if(years.sel[y])
				$(c + " .years .btn:eq("+y+")").addClass("active");
		}
		for (var s in semesters.sel) {
			if(semesters.sel[s])
				$(c + " .semesters .btn:eq("+s+")").addClass("active");
		}
	}

	this.executeQuery = function(source,callback) {
		var toSend = new sendInfo();
		toSend.years = quer.avl.slice(0); //need to change this
		toSend.semesters = quer.sel.slice(0); //need to change this
		toSend.advisor = $(c+" select.advisors").val(); //need to change this
		var jsontoSend = JSON.stringify(toSend);
		$.post('backend.php?pie='+source, { data: jsontoSend}, function (data) {
			var obj = $.parseJSON(data);
			var ret=[];
			$.each(obj, function(i,e) {
				ret.push([i,e]);
			});
			callback(ret);
		}, "text");
	};

}



function populateSelect(pointer,obj,title) {
	$('.control span').remove();
	var old = pointer.find(":selected").text();
	pointer.html('<option>All '+title+'</option>');
	for (var s in obj.avl) {
		pointer.append('<option>'+obj.avl[s]+'</option>');
	}
		pointer.val(old).attr("selected",true);
		update();
}

var plot2;
var update;
$(function () {
	var controller1 = new pieControl(".control1");
	var controller2;
	var source = "lang";
	var titleSource = "Languages";
	var second = false;
	update = function() {
		if (second) {
			controller1.executeQuery(source+"&second", function (return1) {
				controller2.executeQuery(source+"&second", function (return2) {
					plot2 = $.jqplot('pie', [return1, return2],
					{
						title: titleSource + ' used in selected time range by selected advisor',
						fontSize: 12,
						seriesDefaults: {
							renderer: jQuery.jqplot.DonutRenderer,
							rendererOptions: {
								sliceMargin: 3,
								startAngle: -90,
								showDataLabels: true,
								dataLabels: 'label'
							}
						}
					});
					plot2.replot();
				});
			});
		}
		else {
			controller1.executeQuery(source, function (return1) {
				plot2 = $.jqplot('pie', [return1],
					{
						title: titleSource + ' used in selected time range by selected advisor',
						fontSize: 12,
						seriesDefaults: {
							renderer: jQuery.jqplot.PieRenderer,
							rendererOptions: {
								sliceMargin: 3,
								startAngle: -90,
								showDataLabels: true,
								dataLabels: 'label'
							}
						}
					});
					plot2.replot();
				});
		}
	};
	$(".pieSelect").click(function(e) {
		source = $(this).attr('id');
		titleSource = $(this).text();
		update();
		e.preventDefault();
	});
	$(".controlbtn").click(function () {
		if (second===false) {
			$(".outer").text("Outer:");
			$(".inner").text("Inner:");
			$(".controlbtn").text("Close Comparison");
			second = true;
			controller2 = new pieControl(".control2",true);
		}
		else {
			second = false;
			$(".outer").html("&nbsp;");
			$(".inner").html("&nbsp;");
			$(".control2").html("");
			$(".controlbtn").text("Start a Comparison");
			update();
		}
	});
});

var plot1;
$(document).ready(function(){
	$.jqplot.config.enablePlugins = true;
	function drawLineplot(jsonurl,title) {
		var vals = [];
		var ajaxDataRenderer = function(url, plot, options) {
			var ret = [];
			$.ajax({
				async: false,
				url: url,
				dataType:"json",
				success: function(data) {
					$.each(data, function(i,e) {
						ret.push(e);
						vals.push(i);
					});
				}
			});
			return ret;
		};

		plot1 = $.jqplot('chart', jsonurl, {
			title: 'Number of '+title+' Inclusions in Project Applications',
			fontSize: 12,
			dataRenderer: ajaxDataRenderer,
			dataRendererOptions: {  unusedOptionalUrl: jsonurl    },
			axes:{xaxis:{renderer:$.jqplot.DateAxisRenderer}}
		});
		$(".legend").html('');
		setTimeout(function() {
		$.each(plot1.series,function(i,e) {
			$(".legend").append("<label class='checkbox'><input type='checkbox' value='"+i+"'>"+vals[i]+"</label>");
		});
		$(".legend :checkbox").each(function() {
			$(this).attr('checked', true);
			$(this).click(function () {
				if ($(this).is(':checked')) plot1.series[$(this).val()].show=true;
				else plot1.series[$(this).val()].show=false;
				plot1.replot();
			});
			$(this).parent().css('background',plot1.series[$(this).val()].color);
		});
		$("<button class='btn'>Select All</button>").appendTo(".legend").click(function () {
			$(".legend :checkbox").each(function() {
				for (var i in plot1.series) {
					plot1.series[i].show = true;
				}
				plot1.replot();
				$(this).attr('checked', true);
			});
		});
		$("<button class='btn'>Select None</button>").appendTo(".legend").click(function () {
			$(".legend :checkbox").each(function() {
				for (var i in plot1.series) {
					plot1.series[i].show = false;
				}
				plot1.replot();
				$(this).attr('checked', false);
			});
		});
		},1000);
	}
	$(".lineSelect").click(function(e) {
			drawLineplot($(this).attr('id'),$(this).text());
			plot1.replot();
			e.preventDefault();
	});
	$(".lineSelect").first().click();
});