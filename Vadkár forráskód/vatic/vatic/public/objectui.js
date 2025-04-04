function TrackObjectUI(button, container, videoframe, job, player, tracks)
{
    var me = this;

    this.button = button;
    this.container = container;
    this.videoframe = videoframe;
    this.job = job;
    this.player = player;
    this.tracks = tracks;

    this.drawer = new BoxDrawer(videoframe,player,job);

    this.counter = 0;

    this.currentobject = null;
    this.currentcolor = null;

    this.objects = [];

    this.startnewobject = function()
    {

	
        if (this.button.button("option", "disabled"))
        {
            return;
        }

        tracks.drawingnew(true);

        console.log("Starting new track object");

        eventlog("newobject", "Start drawing new object");

        //this.instructions.fadeOut();

        this.currentcolor = this.pickcolor();
        this.drawer.color = this.currentcolor[0];
        this.drawer.enable();

        this.button.button("option", "disabled", true);

        this.currentobject = new TrackObject(this.job, this.player,
                                             this.container,
                                             this.currentcolor);
        this.currentobject.statedraw();

        this.tracks.resizable(false);
        this.tracks.draggable(false);
    }

    this.stopdrawing = function(position)
    {
        console.log("Received new track object drawing");

        var track = tracks.add(player.frame, position, this.currentcolor[0]);

        //this.drawer.disable();
        ui_disable();

	var polygonpoints=this.drawer.polygonpoints;

	var minx=polygonpoints[0];
	var miny=polygonpoints[1];
	var maxx=polygonpoints[0];
	var maxy=polygonpoints[1];
	//put polygonpoints back to frame
	for (var i =0; i < polygonpoints.length; i=i+2) {
		if (polygonpoints[i]<0) polygonpoints[i]=0;
		if (polygonpoints[i]>(this.player.handle.width()-1)) polygonpoints[i]=(this.player.handle.width()-1);
		if (polygonpoints[i+1]<0) polygonpoints[i+1]=0;
		if (polygonpoints[i+1]>(this.player.handle.height()-1)) polygonpoints[i+1]=(this.player.handle.height()-1);
		
	}

	for (var i = 0; i < polygonpoints.length; i=i+2) {
    		if (polygonpoints[i]>maxx) maxx=polygonpoints[i];
		if (polygonpoints[i]<minx) minx=polygonpoints[i];
	}
	for (var i =1; i < polygonpoints.length; i=i+2) {
    		if (polygonpoints[i]>maxy) maxy=polygonpoints[i];
		if (polygonpoints[i]<miny) miny=polygonpoints[i];
	}
	

	console.log((maxx-minx));
	console.log(0.01*(maxx-minx));
	//calculate the poitns to %
	for (var i =0; i < polygonpoints.length; i=i+2) {
		polygonpoints[i] =  (polygonpoints[i]-minx)/(0.01*(maxx-minx));
		polygonpoints[i+1] = (polygonpoints[i+1]-miny)/(0.01*(maxy-miny));
	}
 	
	
 	
	var CssPoly= "polygon(";
	for (var i = 0; i < this.drawer.polygonpoints.length; i=i+2)
        {
           CssPoly=CssPoly+ (this.drawer.polygonpoints[i])+"% "+(this.drawer.polygonpoints[i+1])+"%,";
        }
	CssPoly = CssPoly.substring(0, CssPoly.length - 1);
	//CssPoly=CssPoly+ (this.drawer.polygonpoints[0])+"% "+(this.drawer.polygonpoints[1])+"%,";
	CssPoly=CssPoly+")"
	console.log(CssPoly);

        this.currentobject.onready.push(function() {
            me.stopnewobject();
        });
        this.currentobject.initialize(this.counter, track, this.tracks);
        this.currentobject.stateclassify();
	this.currentobject.track.handle.css({
                "clip-path": CssPoly
            });
	this.currentobject.track.journal.mark(me.player.frame, new Position(minx, miny, maxx, maxy, false, false,CssPoly));
	this.currentobject.track.highlight(true);
    }

    this.stopnewobject = function()
    {
        console.log("Finished new track object");

        ui_enable();
        tracks.drawingnew(false);

        this.objects.push(this.currentobject);

        this.tracks.draggable(true);
        if ($("#annotateoptionsresize:checked").size() == 0)
        {
            this.tracks.resizable(true);
        }
        else
        {
            this.tracks.resizable(false);
        }

        this.tracks.dim(false);
        //this.currentobject.track.highlight(false);
	

        this.button.button("option", "disabled", false);

        this.counter++;
    }

    this.injectnewobject = function(label, path, polygon,attributes)
    {
        console.log("Injecting existing object");

        //this.instructions.fadeOut();

        this.currentcolor = this.pickcolor();
        var obj = new TrackObject(this.job, this.player,
                                  container, this.currentcolor);

	console.log(polygon[0]);
	var CssPoly=polygon[0];
	
        function convert(box,poly)
        {
	    return new Position(box[0], box[1], box[2], box[3],
                                box[6], box[5], poly);
        }
	

	var track = tracks.add(path[0][4], convert(path[0],polygon[0]),
                               this.currentcolor[0]);
        for (var i = 1; i < path.length; i++)
        {
            track.journal.mark(path[i][4], convert(path[i],polygon[i]));	
        }

        obj.initialize(this.counter, track, this.tracks);
	obj.track.handle.css({
                "clip-path": CssPoly
            });
	obj.track.highlight(true);
        obj.finalize(label);

        for (var i = 0; i < attributes.length; i++)
        {
            track.attributejournals[attributes[i][0]].mark(attributes[i][1], attributes[i][2]);
            console.log("Injecting attribute " + attributes[i][0] + " at frame " + attributes[i][1] + " to " + attributes[i][2]);
        }

        obj.statefolddown();
        obj.updatecheckboxes();
        obj.updateboxtext();
        this.counter++;

        return obj;
    }

    this.setup = function()
    {
        this.button.button({
            icons: {
                primary: "ui-icon-plusthick",
            },
            disabled: false
        }).click(function() {
            me.startnewobject();
        });

	
        this.drawer.onstopdraw.push(function(position) {
            me.stopdrawing(position);
        });
	console.log(this.drawer.onstopdraw);

        var html = "<p>Ezen videón az alábbi objektumok jelölhetőek be:</p>";
        html += "<ul>";
        for (var i in this.job.labels)
        {
            html += "<li>" + this.job.labels[i] + "</li>";
        }
        html += "</ul>";

        this.instructions = $(html).appendTo(this.container);
    }

    this.disable = function()
    {
        for (var i in this.objects)
        {
            this.objects[i].disable();
        }
    }

    this.enable = function()
    {
        for (var i in this.objects)
        {
            this.objects[i].enable();
        }
    }

    this.setup();

    this.availcolors = [["#FF00FF", "#FFBFFF", "#FFA6FF"],
                        ["#FF0000", "#FFBFBF", "#FFA6A6"],
                        ["#FF8000", "#FFDCBF", "#FFCEA6"],
                        ["#FFD100", "#FFEEA2", "#FFEA8A"],
                        ["#008000", "#8FBF8F", "#7CBF7C"],
                        ["#0080FF", "#BFDFFF", "#A6D2FF"],
                        ["#0000FF", "#BFBFFF", "#A6A6FF"],
                        ["#000080", "#8F8FBF", "#7C7CBF"],
                        ["#800080", "#BF8FBF", "#BF7CBF"]];

    this.pickcolor = function()
    {
        return this.availcolors[this.availcolors.push(this.availcolors.shift()) - 1];
    }
}

function TrackObject(job, player, container, color)
{
    var me = this;

    this.job = job;
    this.player = player;
    this.container = container;
    this.color = color;

    this.id = null;
    this.track = null;
    this.tracks = null;
    this.label = null;
    this.polypoints=[]

    this.onready = [];
    this.onfolddown = [];
    this.onfoldup = [];

    this.handle = $("<div class='trackobject'><div>");
    this.handle.prependTo(container);
    this.handle.css({
        'background-color': color[2],
        'border-color': color[2]});
    this.handle.mouseover(function() {
        me.mouseover();
    });
    this.handle.mouseout(function() {
        me.mouseout();
    });

    this.header = null;
    this.headerdetails = null;
    this.details = null;
    this.drawinst = null;
    this.classifyinst = null;
    this.opencloseicon = null;

    this.ready = false;
    this.foldedup = false;

    this.tooltip = null;
    this.tooltiptimer = null;

    this.initialize = function(id, track, tracks)
    {
        this.id = id;
        this.track = track;
        this.tracks = tracks;

        this.track.onmouseover.push(function() {
            me.mouseover();
        });

        this.track.onmouseout.push(function() {
            me.mouseout();
            me.hidetooltip();
        });

        this.track.onstartupdate.push(function() {
            me.hidetooltip();
        });

        this.player.onupdate.push(function() {
            me.hidetooltip();
        });

        this.track.oninteract.push(function() {
            var pos = me.handle.position().top + me.container.scrollTop() - 30;
            pos = pos - me.handle.height();
            me.container.stop().animate({scrollTop: pos}, 750);

            me.toggletooltip();
        });

        this.track.onupdate.push(function() {
            me.hidetooltip();
            eventlog("interact", "Interact with box " + me.id);
        });

        this.track.notifyupdate();
        eventlog("newobject", "Finished drawing new object");
    }

    this.remove = function()
    {
        this.handle.slideUp(null, function() {
            me.handle.remove(); 
        });
        this.track.remove();
    }

    this.statedraw = function()
    {
        var html = "<p>Rajzolja körül az alábbi objektumok valamelyikét:</p>"; 

        html += "<ul>";
        for (var i in this.job.labels)
        {
            html += "<li>" + this.job.labels[i] + "</li>";
        }
        html += "</ul>";
        html += "<p>Már bejelölt objektumot ne jelöljön be újra.</p>";

        this.drawinst = $("<div>" + html + "</div>").appendTo(this.handle);
        this.drawinst.hide().slideDown();

        this.container.stop().animate({scrollTop: 0}, 750);

    }

    this.stateclassify = function()
    {
        this.drawinst.slideUp(null, function() {
            me.drawinst.remove(); 
        });

        var length = 0;
        var firsti = 0;
        for (var i in this.job.labels)
        {
            length++;
            firsti = i;
        }

        if (length == 1)
        {
            this.finalize(firsti);
            this.statefolddown();
        }
        else
        {
            var html = "<p>What type of object did you just annotate?</p>";
            for (var i in job.labels)
            {
                var id = "classification" + this.id + "_" + i;
                html += "<div class='label'><input type='radio' name='classification" + this.id + "' id='" + id + "'> <label for='" + id + "'>" + job.labels[i] + "</label></div>";
            }

            this.classifyinst = $("<div>" + html + "</div>").appendTo(this.handle);
            this.classifyinst.hide().slideDown();

            $("input[name='classification" + this.id + "']").click(function() {
                me.classifyinst.slideUp(null, function() {
                    me.classifyinst.remove(); 
                });

                for (var i in me.job.labels)
                {
                    var id = "classification" + me.id + "_" + i;
                    if ($("#" + id + ":checked").size() > 0)
                    {
                        me.finalize(i);
                        me.statefolddown();
                        break;
                    }
                }

            });
        }
    }
    
    this.finalize = function(labelid)
    {
        this.label = labelid;
        this.track.label = labelid;

        this.headerdetails = $("<div style='float:right;'></div>").appendTo(this.handle);
        this.header = $("<p class='trackobjectheader'><strong>" + this.job.labels[this.label] + " " + (this.id + 1) + "</strong></p>").appendTo(this.handle).hide().slideDown();
        //this.opencloseicon = $('<div class="ui-icon ui-icon-triangle-1-e"></div>').prependTo(this.header);
        this.details = $("<div class='trackobjectdetails'></div>").appendTo(this.handle).hide();

        this.setupdetails();

        this.updateboxtext();

        this.track.initattributes(this.job.attributes[this.track.label]);

        this.header.mouseup(function() {
            me.click();
        });

        this.ready = true;
        this._callback(this.onready);

        this.player.onupdate.push(function() {
            me.updateboxtext();
        });
    }

    this.updateboxtext = function()
    {
        var str = "<strong>" + this.job.labels[this.label] + " " + (this.id + 1) + "</strong>";

        var count = 0;
        for (var i in this.job.attributes[this.track.label])
        {
            if (this.track.estimateattribute(i, this.player.frame))
            {
                str += "<br>";
                str += this.job.attributes[this.track.label][i];
                count++;
            }
        }

        this.track.settext(str);

        if ($("#annotateoptionshideboxtext").attr("checked"))
        {
            $(".boundingboxtext").hide();
        }
    }


    this.setupdetails = function()
    {
        this.details.append("<input type='checkbox' id='trackobject" + this.id + "lost'> <label for='trackobject" + this.id + "lost'>Az ablakon kívül található</label><br>");
        this.details.append("<input type='checkbox' id='trackobject" + this.id + "occluded'> <label for='trackobject" + this.id + "occluded'>Takarásban</label><br>");

        for (var i in this.job.attributes[this.track.label])
        {
            this.details.append("<input type='checkbox' id='trackobject" + this.id + "attribute" + i + "'> <label for='trackobject" + this.id + "attribute" + i +"'>" + this.job.attributes[this.track.label][i] + "</label><br>");

            // create a closure on attributeid
            (function(attributeid) {

                $("#trackobject" + me.id + "attribute" + i).click(function() {
                    me.player.pause();

                    var checked = $(this).attr("checked");
                    me.track.setattribute(attributeid, checked ? true : false);
                    me.track.notifyupdate();

                    me.updateboxtext();

                    if (checked) 
                    {
                        eventlog("markattribute", "Mark object as " + me.job.attributes[me.track.label][attributeid]);
                    }
                    else
                    {
                        eventlog("markattribute", "Mark object as not " + me.job.attributes[me.track.label][attributeid]);
                    }
                });

            })(i);
        }


        $("#trackobject" + this.id + "lost").click(function() {
            me.player.pause();

            var outside = $(this).is(":checked");
            me.track.setoutside(outside);
            me.track.notifyupdate();

            if (outside)
            {
                eventlog("markoutside", "Mark object outside");
            }
            else
            {
                eventlog("markoutside", "Mark object inside");
            }
        });
        $("#trackobject" + this.id + "occluded").click(function() {
            me.player.pause();

            var occlusion = $(this).is(":checked");
            me.track.setocclusion(occlusion);
            me.track.notifyupdate();

            if (occlusion)
            {
                eventlog("markocclusion", "Mark object as occluded");
            }
            else
            {
                eventlog("markocclusion", "Mark object as not occluded");
            }
        });

        this.player.onupdate.push(function() {
            me.updatecheckboxes();
        });

        //this.details.append("<br><input type='button' id='trackobject" + this.id + "label' value='Change Type'>");
        this.headerdetails.append("<div style='float:right;'><div class='ui-icon ui-icon-trash' id='trackobject" + this.id + "delete' title='Törlés'></div></div>");
        this.headerdetails.append("<div style='float:right;'><div class='ui-icon ui-icon-unlocked' id='trackobject" + this.id + "lock' title='Szerkesztés lezárása/felodlása'></div></div>");
        this.headerdetails.append("<div style='float:right;'><div class='ui-icon ui-icon-image' id='trackobject" + this.id + "tooltip' title='Előnézet'></div></div>");
	this.headerdetails.append("<div style='float:right;'><div class='ui-icon ui-icon-scissors' id='trackobject" + this.id + "edit' title='Szerkesztés'></div></div>");
        $("#trackobject" + this.id + "delete").click(function() {
            if (window.confirm("Delete the " + me.job.labels[me.label] + " " + (me.id + 1) + " track? If the object just left the view screen, click the \"Outside of view frame\" check box instead."))
            {
                me.remove();
                eventlog("removeobject", "Deleted an object");
            }
        });

        $("#trackobject" + this.id + "lock").click(function() {
            if (me.track.locked)
            {
                me.track.setlock(false);
                $(this).addClass("ui-icon-unlocked").removeClass("ui-icon-locked");
		 var overlay = $('<div id="turkic_overlay"></div>').appendTo("#container");
    		var note = $("<div id='submitdialog'>One moment...</div>").appendTo("#container");
		note.html("Feloldva");
setTimeout(function (){

 note.remove();
 overlay.remove();
}, 500);
		
                   
            }
            else
            {
                me.track.setlock(true);
                $(this).removeClass("ui-icon-unlocked").addClass("ui-icon-locked");
		 var overlay = $('<div id="turkic_overlay"></div>').appendTo("#container");
    		var note = $("<div id='submitdialog'>One moment...</div>").appendTo("#container");
		note.html("Lezárva");
setTimeout(function (){

 note.remove();
 overlay.remove();
}, 500);
		
                   
            }
        });

        $("#trackobject" + this.id + "tooltip").click(function() {
            me.toggletooltip(false);
        }).mouseout(function() {
            me.hidetooltip(); 
        });

	  $("#trackobject" + this.id + "edit").click(function() {
	    me.disable();
	    me.statefoldup();
            //unhiglight object add new canvas

	    //get positions
	    var pos=me.track.handle.position();
	    var x=pos['left']-me.player.handle.offset()['left'];
	    var y=pos['top']-me.player.handle.offset()['top'];
	    var w=me.track.handle.width();
	    var h=me.track.handle.height();
	    var poly=me.track.handle.css("clipPath");

	    //hide object
	    me.track.visible(false);
	    ui_disable(); 


	   
	
	    //calculate polygonpoints	    
	    poly = poly.substring(0, poly.length - 1); 
	    poly=poly.substr(8);
	    poly=poly.split(",");
	    console.log(poly);
	    var polypoints=[];
	    for (var i = 0; i < poly.length; i += 1) {
		var p=poly[i].split(" ");
		if (p.length==2){
			var p0=p[0];
			var p1=p[1];
		}
		else{
			var p0=p[1];
			var p1=p[2];
		}
		p0 = p0.substring(0, p0.length - 1);
		p1 = p1.substring(0, p1.length - 1); 
		polypoints.push(x+w*(parseFloat(p0)/100));
		polypoints.push(y+h*(parseFloat(p1)/100));
	    }	   
	    me.polypoints=polypoints;
	  
	    $("#videoframe").canvasAreaEdit(me.color[0], me.polypoints, me.player.handle.width(),me.player.handle.height() );
	    
	    $ready = $('<button id="CanvReady" type="button" class="btn"><i class="icon-trash"></i>KĂ©sz</button>');
 	    $("#videoframe").after( '<br>', $ready);

	FinishedEditv =function(){
	ui_enable();
	me.enable();
	me.statefolddown();
	var elem = document.getElementById("CanvReady");
    	    elem.parentNode.removeChild(elem);
	    elem = document.getElementById("Canv");
    	    elem.parentNode.removeChild(elem); 
	//update object state 
  	var polygonpoints=me.polypoints;

	console.log(me.polypoints);

	var minx=polygonpoints[0];
	var miny=polygonpoints[1];
	var maxx=polygonpoints[0];
	var maxy=polygonpoints[1];
	//put polygonpoints back to frame
	for (var i =0; i < polygonpoints.length; i=i+2) {
		if (polygonpoints[i]<0) polygonpoints[i]=0;
		if (polygonpoints[i]>(me.player.handle.width()-1)) polygonpoints[i]=(this.player.handle.width()-1);
		if (polygonpoints[i+1]<0) polygonpoints[i+1]=0;
		if (polygonpoints[i+1]>(me.player.handle.height()-1)) polygonpoints[i+1]=(this.player.handle.height()-1);
		
	}

	for (var i = 0; i < polygonpoints.length; i=i+2) {
    		if (polygonpoints[i]>maxx) maxx=polygonpoints[i];
		if (polygonpoints[i]<minx) minx=polygonpoints[i];
	}
	for (var i =1; i < polygonpoints.length; i=i+2) {
    		if (polygonpoints[i]>maxy) maxy=polygonpoints[i];
		if (polygonpoints[i]<miny) miny=polygonpoints[i];
	}
	
	
	//calculate the points to %
	for (var i =0; i < polygonpoints.length; i=i+2) {
		polygonpoints[i] =  (polygonpoints[i]-minx)/(0.01*(maxx-minx));
		polygonpoints[i+1] = (polygonpoints[i+1]-miny)/(0.01*(maxy-miny));
	}
 	
	
 	
	var CssPoly= "polygon(";
	for (var i = 0; i < me.polypoints.length; i=i+2)
        {
           CssPoly=CssPoly+ (me.polypoints[i])+"% "+(me.polypoints[i+1])+"%,";
        }
	CssPoly = CssPoly.substring(0, CssPoly.length - 1);
	//CssPoly=CssPoly+ (this.drawer.polygonpoints[0])+"% "+(this.drawer.polygonpoints[1])+"%,";
	//CssPoly=CssPoly+ "0% 0%,";
	//CssPoly=CssPoly+ "100% 0%,";
	//CssPoly=CssPoly+ "100% 100%,";
	//CssPoly=CssPoly+ "0% 100%,";
	//CssPoly=CssPoly+ "0% 0%,";
	//CssPoly=CssPoly+ "0.5% 0%,";
	//CssPoly=CssPoly+ "0.5% 99.5%,";
	//CssPoly=CssPoly+ "99.5% 99.5%,";
	//CssPoly=CssPoly+ "99.5% 0.5%,";
	//CssPoly=CssPoly+ "0.5% 0.5%";
	CssPoly=CssPoly+")"
	me.track.handle.css({
                "clip-path": CssPoly
            });
	me.track.journal.mark(me.player.frame, new Position(minx, miny, maxx, maxy, false, false,CssPoly));
	me.track.draw(me.player.frame, new Position(minx, miny, maxx, maxy, false, false,CssPoly));
	}


	    document.getElementById("CanvReady").onclick = FinishedEditv;

        });
    }
 

    this.updatecheckboxes = function()
    {
        var e = this.track.estimate(this.player.frame);
        $("#trackobject" + this.id + "lost").attr("checked", e.outside);
        $("#trackobject" + this.id + "occluded").attr("checked", e.occluded);

        for (var i in this.job.attributes[this.track.label])
        {
            if (!this.track.estimateattribute(i, this.player.frame))
            {
                $("#trackobject" + this.id + "attribute" + i).attr("checked", false);
            }
            else
            {
                $("#trackobject" + this.id + "attribute" + i).attr("checked", true);
            }
        }
    }

    this.toggletooltip = function(onscreen)
    {
        if (this.tooltip == null)
        {
            this.showtooltip(onscreen);
        }
        else
        {
            this.hidetooltip();
        }
    }

    this.showtooltip = function(onscreen)
    {
        if (this.tooltip != null)
        {
            return;
        }

        var x;
        var y;
	

        if (onscreen || onscreen == null)
        {
            var pos = this.track.handle.position();
            var width = this.track.handle.width();
            var height = this.track.handle.height();

	   

            var cpos = this.player.handle.position();
            var cwidth = this.player.handle.width();
            var cheight = this.player.handle.height();

            var displacement = 15;

            x = pos.left + width + displacement;
            if (x + 200 > cpos.left + cwidth)
            {
                x = pos.left - 200 - displacement;
            }

            y = pos.top;
            if (y + 200 > cpos.top + cheight)
            {
                y = cpos.top + cheight - 200 - displacement;
            }
        }
        else
        {
            var pos = this.handle.position();
            x = pos.left - 210;

            var cpos = this.player.handle.position();
            var cheight = this.player.handle.height();

            y = pos.top;
            if (y + 200 > cpos.top + cheight)
            {
                y = cpos.top + cheight - 215;
            }
        }
        
        var numannotations = 0;
        var frames = [];
        for (var i in this.track.journal.annotations)
        {
            if (!me.track.journal.annotations[i].outside)
            {
                numannotations++;
                frames.push(i);
            }
        }

        if (numannotations == 0)
        {
            return;
        }

        frames.sort();

        this.tooltip = $("<div class='boxtooltip'></div>").appendTo("body");
        this.tooltip.css({
            top: y + "px",
            left: x + "px"
        });
        this.tooltip.hide();
        var boundingbox = $("<div class='boxtooltipboundingbox boundingbox'></div>").appendTo(this.tooltip);

        var annotation = 0;
        var update = function() {
            if (annotation >= numannotations)
            {
                annotation = 0;
            }

            var frame = frames[annotation];
            var anno = me.track.journal.annotations[frame];
            var bw = anno.xbr - anno.xtl;
            var bh = anno.ybr - anno.ytl;

            var scale = 1;
            if (bw > 200)
            {
                scale = 200 / bw;
            }
            if (bh > 200)
            {
                scale = Math.min(scale, 200 / bh);
            }

            var x = (anno.xtl + (anno.xbr - anno.xtl) / 2) * scale - 100;
            var y = (anno.ytl + (anno.ybr - anno.ytl) / 2) * scale - 100;

            var bx = 100 - (anno.xbr - anno.xtl) / 2 * scale;
            var by = 100 - (anno.ybr - anno.ytl) / 2 * scale;
            bw = bw * scale;
            bh = bh * scale;

            if (x < 0)
            {
                bx += x;
                x = 0;
            }
            if (x > me.job.width * scale - 200)
            {
                bx = 200 - (me.job.width - anno.xtl) * scale;
                x = me.job.width * scale - 200;
            }
            if (y < 0)
            {
                by += y;
                y = 0;
            }
            if (y > me.job.height * scale - 200)
            {
                by = 200 - (me.job.height - anno.ytl) * scale;
                y = (me.job.height) * scale - 200;
            }

            x = -x;
            y = -y;

            console.log("Show tooltip for " + frame);
            me.tooltip.css("background-image", "url('" + me.job.frameurl(frame) + "')");
            me.tooltip.css("background-position", x + "px " + y + "px");
            var bgsize = (me.job.width * scale) + "px " + (me.job.height * scale) + "px";
            me.tooltip.css("background-size", bgsize);
            me.tooltip.css("-o-background-size", bgsize);
            me.tooltip.css("-webkit-background-size", bgsize);
            me.tooltip.css("-khtml-background-size", bgsize);
            me.tooltip.css("-moz-background-size", bgsize);
            annotation++;

            boundingbox.css({
                top: by + "px",
                left: bx + "px",
                width: (bw-4) + "px",
                height: (bh-4) + "px",
                borderColor: me.color[0]
            });
        }


        this.tooltiptimer = window.setInterval(function() {
            update();
        }, 500);

        this.tooltip.hide().slideDown(250);
        update();
    }

    this.hidetooltip = function()
    {
        if (this.tooltip != null)
        {
            this.tooltip.slideUp(250, function() {
                $(this).remove(); 
            });
            this.tooltip = null;
            window.clearInterval(this.tooltiptimer);
            this.tooltiptimer = null;
        }
    }

    this.disable = function()
    {
        if (this.ready)
        {
            $("#trackobject" + this.id + "lost").attr("disabled", true);
            $("#trackobject" + this.id + "occluded").attr("disabled", true);
        }
    }

    this.enable = function()
    {
        if (this.ready)
        {
            $("#trackobject" + this.id + "lost").attr("disabled", false);
            $("#trackobject" + this.id + "occluded").attr("disabled", false);
        }
    }

    this.statefoldup = function()
    {
        this.handle.addClass("trackobjectfoldedup");
        this.handle.removeClass("trackobjectfoldeddown");
        this.details.slideUp();
        this.headerdetails.fadeOut();
        this.foldedup = true;
        this._callback(this.onfoldup);

        //this.opencloseicon.removeClass("ui-icon-triangle-1-s");
        //this.opencloseicon.addClass("ui-icon-triangle-1-e");
    }

    this.statefolddown = function()
    {
        this.handle.removeClass("trackobjectfoldedup");
        this.handle.addClass("trackobjectfoldeddown");
        this.details.slideDown();
        this.headerdetails.fadeIn();
        this.foldedup = false;
        this._callback(this.onfolddown);

        //this.opencloseicon.removeClass("ui-icon-triangle-1-e");
        //this.opencloseicon.addClass("ui-icon-triangle-1-s");
    }

    this.mouseover = function()
    {
        this.highlight();

        if (this.track)
        {
            this.tracks.dim(true);
            this.track.dim(false);
            this.track.highlight(true);
        }

        if (this.opencloseicon)
        {
            this.opencloseicon.addClass("ui-icon-triangle-1-se");
        }
    }

    this.highlight = function()
    {
        this.handle.css({
            'border-color': me.color[0],
            'background-color': me.color[1],
        });
    }

    this.mouseout = function()
    {
        this.unhighlight();

        if (this.track)
        {
            this.tracks.dim(false);
            //this.track.highlight(false);
        }

        if (this.opencloseicon)
        {
            this.opencloseicon.removeClass("ui-icon-triangle-1-se");
        }
    }

    this.unhighlight = function()
    {
        this.handle.css({
            'border-color': me.color[2],
            'background-color': me.color[2],
        });
    }

    this.click = function()
    {
        return; // disable fold down
        if (this.ready)
        {
            if (this.foldedup)
            {
                this.statefolddown();
            }
            else
            {
                this.statefoldup();
            }
        }
    }

    this._callback = function(list)
    {
        for (var i = 0; i < list.length; i++)
        {
            list[i](me);
        }
    }
}
