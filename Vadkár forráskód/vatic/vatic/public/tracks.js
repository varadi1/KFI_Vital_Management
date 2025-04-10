/*
 * Allows the user to draw a box on the screen.
 */
function BoxDrawer(container, player,job)
{
    var me = this;

    this.onstartdraw = [];
    this.onstopdraw = []
    this.player =player;
    this.job = job;
    this.polygonpoints=[];

    this.enabled = false;
    this.drawing = 0;

    this.startx = 0;
    this.starty = 0;

    this.container = container;
    this.handle = null;
    this.color = null;

    this.vcrosshair = null;
    this.hcrosshair = null;

  
    this.delcanvas = function()
    {
	
	console.log(this.polygonpoints);
	var minx=this.polygonpoints[0];
	var miny=this.polygonpoints[1];
	var maxx=this.polygonpoints[0];
	var maxy=this.polygonpoints[1];
	for (var i = 0; i < this.polygonpoints.length; i=i+2) {
    		if (this.polygonpoints[i]>maxx) maxx=this.polygonpoints[i];
		if (this.polygonpoints[i]<minx) minx=this.polygonpoints[i];
	}
	for (var i =1; i < this.polygonpoints.length; i=i+2) {
    		if (this.polygonpoints[i]>maxy) maxy=this.polygonpoints[i];
		if (this.polygonpoints[i]<miny) miny=this.polygonpoints[i];
	}
 	for (var i in this.onstopdraw)
            {
                this.onstopdraw[i](new Position(minx, miny, maxx, maxy,false, false, 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)'));
            }	
        this.enabled = false;	
	var elem = document.getElementById("CanvDel");
    	    elem.parentNode.removeChild(elem);
	    elem = document.getElementById("CanvReady");
    	    elem.parentNode.removeChild(elem);
	    elem = document.getElementById("Canv");
    	    elem.parentNode.removeChild(elem);       
	this.drawing=0;
	 this.container.css({
            'cursor': 'default'
        });
	
        //this.vcrosshair.remove();
        //this.hcrosshair.remove();
    }
  

    /*
     * Enables the drawer.
     */
    this.enable = function()
    {
	this.polygonpoints=[];
        this.enabled = true;

        this.container.css({
            'cursor': 'crosshair'
        });

	
	
	$("#videoframe").canvasAreaDraw(this.color, this.polygonpoints,this.player.handle.width(),this.player.handle.height() );

	$ready = $('<button id="CanvReady" type="button" class="btn"><i class="icon-trash"></i>Kész</button>');
 	$("#videoframe").after( '<br>', $ready);

	document.getElementById("CanvReady").onclick = drawfinished;
	//$ready.onclick(me.delcanvas());


	for (var i in this.onstartdraw)
            {
                this.onstartdraw[i]();
            }

    }

    drawfinished = function(){
	me.delcanvas();
}
   

    /*
     * Disables the drawer. No boxes can be drawn and interface cues are
     * disabled.
     */
 /*
    this.disable = function()
    {
        this.enabled = false;

        this.container.css({
            'cursor': 'default'
        });
	
        //this.vcrosshair.remove();
        //this.hcrosshair.remove();

	var elem = document.getElementById("CanvDel");
    	    elem.parentNode.removeChild(elem);
	    elem = document.getElementById("Canv");
    	    elem.parentNode.removeChild(elem);
    }
 */
    /*
     * Method called when we receive a click on the target area.
     */
 /*
    this.click = function(xc, yc)
    {

	
        if (this.enabled)
        {
            if (this.drawing==0)
            {
		this.drawing=1;
		
		
		//this.startdrawing(xc, yc);
            }
	    else if (this.drawing==1){
		this.drawing=2;
	    }
            else
            {
                //this.finishdrawing(xc, yc);
            }
        }
    }
    */
    /*
     * Updates the current visualization of the current box.
     */
    this.updatedrawing = function(xc, yc)
    {
        if (this.drawing==1)
        {
            var pos = this.calculateposition(xc, yc);
            var offset = this.container.offset();
            //this.handle.css({
            //    "top": pos.ytl + offset.top + "px",
            //    "left": pos.xtl + offset.left + "px",
            //    "width": (pos.width - 3) + "px",
            //    "height": (pos.height - 3)+ "px",
	    //	"border-color": this.color
            //});
        }
    }

/*    
     * Updates the cross hairs.
    
/*
    this.updatecrosshairs = function(visible, xc, yc)
    {
        if (this.enabled)
        {
            if (visible && this.drawing==0)
            {
                this.vcrosshair.show().css('left', xc + 'px');
                this.hcrosshair.show().css('top', yc + 'px');
            }
            else
            {
                this.vcrosshair.hide();
                this.hcrosshair.hide();
            }
        }
    }
    /*
     * Calculates the position of the box given the starting coordinates and
     * some new coordinates.
     */
    this.calculateposition = function(xc, yc)
    {
        var xtl = Math.min(xc, this.startx);
        var ytl = Math.min(yc, this.starty);
        var xbr = Math.max(xc, this.startx);
        var ybr = Math.max(yc, this.starty);
        return new Position(xtl, ytl, xbr, ybr,false, false, 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)')
    }

    
    /*
     * Cancels the current drawing.
     */
    this.canceldrawing = function()
    {
        if (this.drawing!=0)
        {
            console.log("Cancelling drawing");
            this.drawing = 0;
            this.handle.remove();
            this.startx = 0;
            this.starty = 0;
	    
        }
    }


    
}

var track_collection_dump = null;

/*
 * A collection of tracks.
 */
function TrackCollection(player, job)
{
    var me = this;

    this.player = player;
    this.job = job;
    this.tracks = [];

    this.onnewobject = []; 

    player.onupdate.push(function() {
        me.update(player.frame);
    });

    /*player.onpause.push(function() {
        for (var i in me.tracks)
        {
            me.tracks[i].recordposition();
        }
    });*/

    // if the window moves, we have to update boxes
    $(window).resize(function() {
        me.update(me.player.frame);
    });

    /*
     * Creates a new object.
     */
    this.add = function(frame, position, color)
    {
        var track = new Track(this.player, color, position);
        this.tracks.push(track);

        console.log("Added new track");

        for (var i = 0; i < this.onnewobject.length; i++)
        {
            this.onnewobject[i](track);
        }

        return track;
    }

    /*
     * Changes the draggable functionality. If true, allow dragging,
     * otherwise disable.
     */
    this.draggable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draggable(value);
        }
    }

    /*
     * Changes the resize functionality. If true, allow resize, otherwise disable.
     */
    this.resizable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].resizable(value);
        }
    }

    /*
     * Changes the visibility on the boxes. If true, show boxes, otherwise hide.
     */
    this.visible = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].visible(value);
        }
    }

    /*
     * Changes the opacity on the boxes.
     */
    this.dim = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].dim(value);
        }
    }

    this.drawingnew = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].drawingnew = value;
        }
    }

    /*
     * Updates boxes with the given frame
     */
    this.update = function(frame)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draw(frame);
        }
    }

    /*
     * Returns the number of tracks.
     */
    this.count = function()
    {
        var count = 0;
        for (var i in this.tracks)
        {
            if (!this.tracks[i].deleted)
            {
                count++;
            }
        }
        return count;
    }
    
    this.recordposition = function()
    {
        for (var i in this.tracks)
        {
            this.tracks[i].recordposition();
        }
    }

    /*
     * Serializes all tracks for sending to server.
     */
    this.serialize = function()
    {
        var count = 0;
        var str = "[";
        for (var i in this.tracks)
        {
            if (!this.tracks[i].deleted)
            {
                str += this.tracks[i].serialize() + ",";
                count++;
            }
        }
        if (count == 0)
        {
            return "[]";
        }
        return str.substr(0, str.length - 1) + "]";
    }

    track_collection_dump = function() {
        return me.serialize();
    };
}

/*
 * A track class.
 */
function Track(player, color, position)
{
    var me = this;

    this.journal = new Journal(player.job.start, player.job.blowradius);
    this.attributejournals = {};
    this.label = null;
    this.player = player;
    this.handle = null;
    this.color = color;
    this.htmloffset = 3;
    this.deleted = false;


    this.onmouseover = [];
    this.onmouseout = [];
    this.oninteract = [];
    this.onupdate = [];
    this.onstartupdate = [];

    this.candrag = true;
    this.canresize = true;

    this.locked = false;
    this.drawingnew = false;

    this.journal.mark(this.player.job.start,
        new Position(position.xtl, position.ytl,
                     position.xbr, position.ybr, 
                     false, true, position.polygon));

    this.journal.mark(this.player.frame, position);

    this.journal.artificialrightframe = this.player.job.stop;
    this.journal.artificialright = position;

    /*
     * Polls the on screen position of the box and returns it.
     */
    this.pollposition = function()
    {
        var hidden = this.handle.css("display") == "none";
        this.handle.show();

        var pos = this.handle.position();
        var width = this.handle.width();
        var height = this.handle.height();
        var offset = this.player.handle.offset();

        if (hidden)
        {
            this.handle.hide();
        }

        if (width < 1)
        {
            width = 1;
        }

        if (height < 1)
        {
            height = 1;
        }

        var xtl = pos.left - offset.left;
        var ytl = pos.top - offset.top;
        var xbr = xtl + width + this.htmloffset;
        var ybr = ytl + height + this.htmloffset;

        var estimate = this.estimate(this.player.frame);
        var position = new Position(xtl, ytl, xbr, ybr)
        position.occluded = estimate.occluded;
        position.outside = estimate.outside;
	position.polygon = estimate.polygon;
        return position;
    }

    /*
     * Polls the on screen position and marks it in the journal.
     */
    this.recordposition = function()
    {
        this.journal.mark(this.player.frame, this.pollposition());
        this.journal.artificialright = this.journal.rightmost();
    }

    /*
     * Fixes the position to force box to be inside frame.
     */
    this.fixposition = function()
    {
        var width = this.player.job.width;
        var height = this.player.job.height;
        var pos = this.pollposition();

        if (pos.xtl > width)
        {
            pos = new Position(width - pos.width, pos.ytl, width, pos.ybr,pos.occluded,pos.outside,pos.polygon);
        }
        if (pos.ytl > height)
        {
            pos = new Position(pos.xtl, height - pos.height, pos.xbr, height,pos.occluded,pos.outside,pos.polygon);
        }
        if (pos.xbr < 0)
        {
            pos = new Position(0, pos.ytl, pos.width, pos.ybr,pos.occluded,pos.outside,pos.polygon);
        }
        if (pos.ybr < 0)
        {
            pos = new Position(pos.xtl, 0, pos.xbr, pos.height,pos.occluded,pos.outside,pos.polygon);
        }

        var xtl = Math.max(pos.xtl, 0);
        var ytl = Math.max(pos.ytl, 0); 
        var xbr = Math.min(pos.xbr, width - 1);
        var ybr = Math.min(pos.ybr, height - 1);

        var fpos = new Position(xtl, ytl, xbr, ybr,pos.occluded,pos.outside,pos.polygon);
        fpos.occluded = pos.occluded;
        fpos.outside = pos.outside;
	//!!!check if polygon is outside
        this.draw(this.player.frame, fpos);
    }

    /*
     * Notifies that there was an update to this box.
     */
    this.notifyupdate = function()
    {
        for (var i in this.onupdate)
        {
            this.onupdate[i]();
        }
    }

    this.notifystartupdate = function()
    {
        for (var i in this.onstartupdate)
        {
            this.onstartupdate[i]();
        }
    }

    /*
     * Sets the current position as occluded.
     */
    this.setocclusion = function(value)
    {
        if (value)
        {   
            console.log("Marking object as occluded here.");
        }
        else
        {
            console.log("Marking object as not occluded here.");
        }

        var pos = this.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.occluded = value;
        this.journal.mark(this.player.frame, pos);
        this.journal.artificialright = this.journal.rightmost();
        this.draw(this.player.frame, pos);
    }

    /*
     * Sets the current position as outside.
     */
    this.setoutside = function(value)
    {
        if (value)
        {   
            console.log("Marking object as outside here.");
        }
        else
        {
            console.log("Marking object as not outside here.");
        }

        var pos = this.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.outside = value;
        this.journal.mark(this.player.frame, pos);
        this.journal.artificialright = this.journal.rightmost();
        this.draw(this.player.frame, pos);
    }

    this.setattribute = function(id, value)
    {
        var journal = this.attributejournals[id];
        journal.mark(this.player.frame, value);
        //journal.artificialright = journal.rightmost();
    }

    this.initattributes = function(attributes)
    {
        for (var i in attributes)
        {
            var journal = new Journal(this.player.job.start, 
                                      this.player.job.blowradius);
            journal.mark(this.player.job.start, false);
            //journal.artificialright = journal.rightmost();
            //journal.artificialrightframe = this.player.job.stop;

            this.attributejournals[i] = journal;
        }
    }

    this.estimateattribute = function(id, frame)
    {
        if (this.attributejournals[id] == null)
        {
            return false;
        }

        var bounds = this.attributejournals[id].bounds(frame);
        if (bounds['left'] == null)
        {
            return bounds['right'];
        }

        return bounds['left'];
    }

    /*
     * Changes the text on the bounding box.
     */
    this.settext = function(value)
    {
        if (this.handle != null)
        {
            var t = this.handle.children(".boundingboxtext");
            t.html(value).show();
        }

    }

    /*
     * Changes the lock state
     */
    this.setlock = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.locked = value;

        if (value)
        {
            this.handle.draggable("option", "disabled", true);
            this.handle.resizable("option", "disabled", true);
        }
        else
        {
            this.handle.draggable("option", "disabled", !this.candrag);
            this.handle.resizable("option", "disabled", !this.canresize);
        }

        if (value)
        {
            this.handle.addClass("boundingboxlocked");
        }
        else
        {
            this.handle.removeClass("boundingboxlocked");
        }
    }

    /*
     * Draws the current box on the screen. 
     */
    this.draw = function(frame, position)
    {
        if (this.handle == null)
        {
            this.handle = $('<div class="boundingbox"><div class="boundingboxtext"></div></div>');
            //this.handle.css("border-color", this.color);
            this.handle.css("border-color", "#FFFFFF");
            this.handle.css("border-width", "5px");

            var fill = $('<div class="fill"></div>').appendTo(this.handle);
            fill.css("background-color", this.color);
            this.player.handle.append(this.handle);

            this.handle.children(".boundingboxtext").hide().css({
                "border-color": this.color,
                //"color": this.color
                });

            this.handle.resizable({
                handles: "n,w,s,e",
                autoHide: true,
                ghost: true, /* need to fix this bug soon */
                start: function() {
                    player.pause();
                    me.notifystartupdate();
                    //me.triggerinteract();
                    for (var i in me.onmouseover)
                    {
                        me.onmouseover[i]();
                    }
                },
                stop: function() {
                    me.fixposition();
                    me.recordposition();
                    me.notifyupdate();
                    eventlog("resizable", "Resize a box");
                    //me.highlight(false);
                },
                resize: function() {
                    me.highlight(true);
                }
            });

            this.handle.draggable({
                start: function() {
                    player.pause();
                    me.notifystartupdate();
                    //me.triggerinteract();
                },
                stop: function() { 
                    me.fixposition();
                    me.recordposition();                
                    me.notifyupdate();
                    eventlog("draggable", "Drag-n-drop a box");
                },
                cancel: ".boundingboxtext"
            });

            this.handle.mouseover(function() {
                if (!me.locked && !me.drawingnew)
                {
                    for (var i in me.onmouseover)
                    {
                        me.onmouseover[i]();
                    }
                }
            });

            this.handle.mouseout(function() {
                if (!me.locked && !me.drawingnew)
                {
                    for (var i in me.onmouseout)
                    {
                        me.onmouseout[i]();
                    }
                }
            });

            this.handle.click(function() {
                me.triggerinteract();
            });
        }

        if (position == null)
        {
            position = this.estimate(frame);
        }

        if (position.outside)
        {
            this.handle.hide();
            return;
        }

        this.handle.show();
        
        if (position.occluded)
        {
            this.handle.addClass("boundingboxoccluded");
        }
        else
        {
            this.handle.removeClass("boundingboxoccluded");
        }

        var offset = this.player.handle.offset();

        this.handle.css({
            top: position.ytl + offset.top + "px",
            left: position.xtl + offset.left + "px",
            width: (position.width - this.htmloffset) + "px",
            height: (position.height - this.htmloffset) + "px",
	    "clip-path": position.polygon
        });
	
    }

    this.triggerinteract = function() 
    {
        if (!this.locked && !this.drawingnew)
        {
            for (var i in this.oninteract)
            {
                this.oninteract[i]();
            }
        }
    }

    this.draggable = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.candrag = value;

        if (value && !this.locked && !this.drawingnew)
        {
            this.handle.draggable("option", "disabled", false);
        }
        else
        {
            this.handle.draggable("option", "disabled", true);
        }
    }

    this.resizable = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.canresize = value;

        if (value && !this.locked &&!this.drawingnew)
        {
            this.handle.resizable("option", "disabled", false);
        }
        else
        {
            this.handle.resizable("option", "disabled", true);
        }
    }   

    this.visible = function(value)
    {
        if (value && !this.pollposition().outside)
        {
            this.handle.show();
        }
        else
        {
            this.handle.hide();
        }
    }

    /*
     * Dims the visibility of the box.
     */
    this.dim = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxdim");
        }
        else
        {
            this.handle.removeClass("boundingboxdim");
        }
    }

    /*
     * Highlights a box.
     */
    this.highlight = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxhighlight");
        }
        else
        {
            this.handle.removeClass("boundingboxhighlight");
        }
    }

    /*
     * Serializes the tracks.
     */
    this.serialize = function()
    {
        if (this.deleted)
        {
            return "";
        }
        var str = "[" + this.label + "," + this.journal.serialize() + ",{";

        var length = 0;
        for (var i in this.attributejournals)
        {
            str += '"' + i + '":' + this.attributejournals[i].serialize() + ",";
            length++;
        }

        if (length > 0)
        {
            str = str.substr(0, str.length - 1);
        }

        return str += "}]";
    }

    /*
     * Removes the box.
     */
    this.remove = function()
    {
        this.handle.remove();
        this.deleted = true;
    }

    /*
     * Estimates the position of the box for visualization purposes.
     * If the frame was annotated, returns that position, otherwise
     * attempts to interpolate or extrapolate.
     */
    this.estimate = function(frame)
    {
        var bounds = this.journal.bounds(frame);
        if (bounds['leftframe'] == bounds['rightframe'])
        {
            return bounds['left'];
        }

        if (bounds['right'] == null || bounds['left'].outside)
        {
            return bounds['left'];
        }

        if (bounds['right'].outside)
        {
            return bounds['right'];
        }

        var fdiff = bounds['rightframe'] - bounds['leftframe'];
        var xtlr = (bounds['right'].xtl - bounds['left'].xtl) / fdiff;
        var ytlr = (bounds['right'].ytl - bounds['left'].ytl) / fdiff;
        var xbrr = (bounds['right'].xbr - bounds['left'].xbr) / fdiff;
        var ybrr = (bounds['right'].ybr - bounds['left'].ybr) / fdiff;

        var off = frame - bounds['leftframe'];
        var xtl = bounds['left'].xtl + xtlr * off;
        var ytl = bounds['left'].ytl + ytlr * off;
        var xbr = bounds['left'].xbr + xbrr * off;
        var ybr = bounds['left'].ybr + ybrr * off;

        var occluded = false;
        var outside = false;
	var leftpolies=bounds['left'].polygon;
	console.log(bounds['left'].polygon);
	leftpolies = leftpolies.substring(0, leftpolies.length - 1); 
	leftpolies=leftpolies.substr(8);
	leftpolies=leftpolies.split(",");
	var rightpolies=bounds['right'].polygon;
	rightpolies = rightpolies.substring(0, rightpolies.length - 1); 
	rightpolies=rightpolies.substr(8);
	rightpolies=rightpolies.split(",");
	var polypoints="polygon(";
	for (var i = 0; i < leftpolies.length; i += 1) {
		var lp=leftpolies[i].split(" ");
		var rp=rightpolies[i].split(" ");
		if (lp.length==2){
			var lp0=lp[0];
			var lp1=lp[1];
			var rp0=rp[0];
			var rp1=rp[1];
		}
		else{
			var lp0=lp[1];
			var lp1=lp[2];
			var rp0=rp[1];
			var rp1=rp[2];
		}
		rp0 = rp0.substring(0, rp0.length - 1);
		rp1 = rp1.substring(0, rp1.length - 1); 
		lp0 = lp0.substring(0, lp0.length - 1);
		lp1 = lp1.substring(0, lp1.length - 1); 
		var p0=((parseFloat(rp0)-parseFloat(lp0))/ fdiff)*off+parseFloat(lp0);
		var p1=((parseFloat(rp1)-parseFloat(lp1))/ fdiff)*off+parseFloat(lp1); 
		
		polypoints=polypoints+(p0.toString())+"% "+(p1.toString())+"%,";
	    }	   
	  polypoints = polypoints.substring(0, polypoints.length - 1);
          polypoints=polypoints+")"
	  console.log(polypoints);
	  //console.log(polypoints);
//        if (Math.abs(bounds['rightframe'] - frame) > Math.abs(bounds['leftframe'] - frame))
//        {
//            occluded = bounds['right'].occluded;
//            outside = bounds['right'].outside;
//        }
//        else
//        {
            occluded = bounds['left'].occluded;
            outside = bounds['left'].outside;
//        }

        return new Position(xtl, ytl, xbr, ybr, occluded, outside, polypoints);
    }

    this.draw(this.player.frame);
}

/*
 * A journal to store a set of positions.
 */
function Journal(start, blowradius)
{
    this.annotations = {};
    this.artificialright = null;
    this.artificialrightframe = null;
    this.blowradius = blowradius;
    this.start = start;

    /*
     * Marks the boxes position.
     */
    this.mark = function(frame, position) 
    {
        console.log("Marking " + frame);

        var newannotations = {};

        for (var i in this.annotations)
        {
            if (Math.abs(i - frame) >= this.blowradius)
            {
                newannotations[i] = this.annotations[i];
            }
            else if (i == this.start)
            {
                console.log("Start would blow, so propagating");
                newannotations[i] = position;
            }
            else
            {
                console.log("Blowing out annotation at " + i);
            }
        }

        this.annotations = newannotations;
        this.annotations[frame] = position;
    }




    
    this.bounds = function(frame)
    {
        if (this.annotations[frame])
        {
            var item = this.annotations[frame];
            return {'left': item,
                    'leftframe': frame,
                    'right': item,
                    'rightframe': frame};
        }

        var left = null;
        var right = null;
        var lefttime = 0;
        var righttime = 0;

        for (t in this.annotations)
        {
            var item = this.annotations[t];
            itemtime = parseInt(t);

            if (itemtime <= frame)
            {
                if (left == null || itemtime > lefttime) 
                {
                    left = item;
                    lefttime = itemtime;;
                }
            }
            else
            {
                if (right == null || itemtime < righttime)
                {
                    right = item;
                    righttime = itemtime;
                }
            }
        }

        return {'left': left,
                'leftframe': lefttime,
                'right': right,
                'rightframe': righttime};
    }

    /*
     * Gets the right most annotation.
     */
    this.rightmost = function()
    {
        var item = null
        var itemtime = null;
        for (var t in this.annotations)
        {
            if (itemtime == null || t > itemtime)
            {
                item = this.annotations[t];
                itemtime = t;
            }
        }
        return item;
    }

    /*
     * Serializes this journal based on position.
     */
    this.serialize = function()
    {
        if (this.annotations.length == 0)
        {
            return "{}";
        }

        str = "{";
        for (var frame in this.annotations)
        {
            var dat = this.annotations[frame];
            if (dat instanceof Object)
            {
                dat = dat.serialize();
            }
            str += "\"" + frame + "\":" + dat + ",";
        }

        if (this.artificialrightframe != null && this.annotations[this.artificialrightframe] == null)
        {
            console.log("Using artificial in serialization");
            var dat = this.artificialright;
            if (dat instanceof Object)
            {
                dat = dat.serialize();
            }
            str += "\"" + this.artificialrightframe + "\":" + dat + ",";
        }
        return str.substr(0, str.length - 1) + "}";
    }
}

/*
 * A structure to store a position.
 * Occlusion and outside is optional.
 */
function Position(xtl, ytl, xbr, ybr, occluded, outside, polygon)
{
    this.xtl = xtl;
    this.ytl = ytl;
    this.xbr = xbr;
    this.ybr = ybr;
    this.polygon = polygon;
    this.occluded = occluded ? true : false;
    this.outside = outside ? true : false;
    this.width = xbr - xtl;
    this.height = ybr - ytl;

    if (this.xbr <= this.xtl)
    {
        this.xbr = this.xtl + 1;
    }

    if (this.ybr <= this.ytl)
    {
        this.ybr = this.ytl + 1;
    }
    this.serialize = function()
    {
	console.log(this.polygon);
	var p = this.polygon
        p = p.split('% ').join(',');
	p = p.split('%,').join(',');
	p = p.replace('polygon(','');
	p = p.replace('%)','');
        return "[" + this.xtl + "," +
                     this.ytl + "," +
                     this.xbr + "," +
                     this.ybr + "," +
                     this.occluded + "," +
                     this.outside + "," +
                     p + 
			"]";
    }

    this.clone = function()
    {
        return new Position(this.xtl,
                            this.ytl,
                            this.xbr,
                            this.ybr,
                            this.occluded,
                            this.outside,
			    this.polygon)
    }
}
