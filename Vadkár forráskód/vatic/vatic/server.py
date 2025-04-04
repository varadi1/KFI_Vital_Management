#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os.path, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import subprocess
import os
from datetime import datetime, date, time
import config
import subprocess
from turkic.server import handler, application
from turkic.database import session
import cStringIO
from models import *
import generateXML
import paramiko
import mysql.connector
import cPickle as pickle
import uuid

from ownconfig import *

import logging
logger = logging.getLogger("vatic.server")

@handler()
def getjob(id, verified):
    logger.debug("Running get job")
    job = session.query(Job).get(id)

    logger.debug("Found job {0}".format(job.id))

    if int(verified) and job.segment.video.trainwith:
        # swap segment with the training segment
        training = True
        segment = job.segment.video.trainwith.segments[0]
        logger.debug("Swapping actual segment with training segment")
    else:
        training = False
        segment = job.segment

    video = segment.video
    labels = dict((l.id, l.text) for l in video.labels)

    attributes = {}
    for label in video.labels:
        attributes[label.id] = dict((a.id, a.text) for a in label.attributes)

    logger.debug("Giving user frames {0} to {1} of {2}".format(video.slug,
                                                               segment.start,
                                                               segment.stop))

    return {"start":        segment.start,
            "stop":         segment.stop,
            "slug":         video.slug,
            "width":        video.width,
            "height":       video.height,
            "skip":         video.skip,
            "perobject":    video.perobjectbonus,
            "completion":   video.completionbonus,
            "blowradius":   video.blowradius,
            "jobid":        job.id,
            "training":     int(training),
            "labels":       labels,
            "attributes":   attributes}


@handler()
def getboxesforjob(id):
    job = session.query(Job).get(id)
    result = []
    for path in job.paths:
        attrs = [(x.attributeid, x.frame, x.value) for x in path.attributes]
	boxes, polygons = path.getboxes()
	br=[]
	for b in boxes:
		br.append(tuple(b))
	poly=[]
	for p in polygons:
		pstr="polygon("
		for e in p:
			pstr+= str(e.x)+"% "+str(e.y)+"%,"
		pstr=pstr[:-1]+")"
		poly.append(pstr)
        result.append({"label": path.labelid,
                       "boxes": br,
		       "polygons": poly,
		       "attributes": attrs})
    return result


def readpaths(tracks, AddPolygons=False):
    paths = []
    logger.debug("Reading {0} total tracks".format(len(tracks)))

    for label, track, attributes in tracks:
        path = Path()
        path.label = session.query(Label).get(label)
        
        logger.debug("Received a {0} track".format(path.label.text))

        visible = False
        for frame, userbox in track.items():
            box = Box(path = path)
            box.xtl = max(int(userbox[0]), 0)
            box.ytl = max(int(userbox[1]), 0)
            box.xbr = max(int(userbox[2]), 0)
            box.ybr = max(int(userbox[3]), 0)
            box.occluded = int(userbox[4])
            box.outside = int(userbox[5])
	    box.frame = int(frame)
            if not box.outside:
                visible = True
	    if AddPolygons:
		ind=1			
		for a in range(6,len(userbox),2):
			poly = Polygon(box = box)
			poly.number=ind
			poly.x=float(userbox[a])
			poly.y=float(userbox[a+1])	
			ind+=1		
            logger.debug("Received box {0}".format(str(box.getbox())))
	    #
        if not visible:
            logger.warning("Received empty path! Skipping")
            continue

        for attributeid, timeline in attributes.items():
            attribute = session.query(Attribute).get(attributeid)
            for frame, value in timeline.items():
                aa = AttributeAnnotation()
                aa.attribute = attribute
                aa.frame = frame
                aa.value = value
                path.attributes.append(aa)

        paths.append(path)
    return paths

@handler(post = "json")
def savejob(id, tracks):
    logger.debug(tracks)

    job = session.query(Job).get(id)

    for path in job.paths:
        session.delete(path)
    session.commit()
    for path in readpaths(tracks,AddPolygons=True):
    	logger.debug(path)
        job.paths.append(path)
					
    session.add(job)
    session.commit()


    #connect to vatic database
    username=config.database.split(':')[1]
    username=username.split('/')[-1]
    dbname=config.database.split('/')[-1]
    pwd=config.database.split('@')[0]
    pwd=pwd.split(':')[-1]
    hostname=config.database.split('@')[1]
    hostname=hostname.split('/')[0]
    cnx = mysql.connector.connect(user=username, password=pwd,
                              host=hostname,
                              database=dbname,buffered=True)
    cursor = cnx.cursor()
    query = "SELECT videoid FROM segments WHERE id=\'"+str(id)+"\'"
    cursor.execute(query)
    for rec in cursor:
	videoid=rec[0]
	cursor2 = cnx.cursor()
	query2 = "SELECT slug FROM videos WHERE id=\'"+str(videoid)+"\'"
	cursor2.execute(query2)
	for rec2 in cursor2:
		line=rec2[0].encode('utf-8')
		print line
    		ExportCommand='cd '+HomeDir+'; turkic dump '+line+' -o '+AnnotationDirFull+'/'+line+'.xml --xml --merge --merge-threshold 0.5'
    		os.popen(ExportCommand,"r")
     	cursor2.close()
    cursor.close()
    cnx.close()

@handler(post = "json")
def validatejob(id, tracks):
    job = session.query(Job).get(id)
    paths = readpaths(tracks)

    return job.trainingjob.validator(paths, job.trainingjob.paths)

@handler()
def getvaticnames():
	ret=''
	LinksCommand=os.popen('ls '+PublicDir +'/frames',"r")
	while True:		
		Link= LinksCommand.readline()
		if not Link:
			break
		Link=Link.strip()
		ret+=Link+"\n"
	ret=ret[0:-1]
	return ret


@handler()
def rename(vaticname,newname):
	ret=""
	#find the real vatic name of the current name
	command=os.popen('readlink -f '+PublicDir+'/frames/'+vaticname,"r")
	RealVaticName=(command.readline()).strip()
	RealVaticName=RealVaticName.split("/")[-1]
	#check if new name is not taken
	LinksCommand=os.popen('ls '+PublicDir +'/frames',"r")
	NameTaken=False
	while True:		
		Link= LinksCommand.readline()
		if not Link:
			break
		Link=Link.strip()
		if newname==Link:
			NameTaken=True
	if RealVaticName=="":
		ret="No vatic annotation was found under this name"
	if NameTaken:
		ret="The new name is already taken"
	if RealVaticName!="" and not NameTaken:
		#rename in vatic
		if os.path.isdir(PublicDir+"/frames/"+vaticname):
			#rename the data the vatic folder
			c="mv "+VideoDataDir +"/" +vaticname+VideoDataDir +"/" +newname
			os.popen(c,"r")

			#rename it in the vatic database
			#connect to vatic database
			username=config.database.split(':')[1]
			username=username.split('/')[-1]
			dbname=config.database.split('/')[-1]
			pwd=config.database.split('@')[0]
			pwd=pwd.split(':')[-1]
			hostname=config.database.split('@')[1]
			hostname=hostname.split('/')[0]
			cnx = mysql.connector.connect(user=username, password=pwd,
                              host=hostname,
                              database=dbname,buffered=True)
			cursor = cnx.cursor()
			query = "UPDATE videos SET location=\'/data/video/"+str(newname)+"\' WHERE slug=\'"+str(vaticname)+"\';"
			cursor.execute(query)
			cursor2 = cnx.cursor()			
			query = "UPDATE videos SET slug=\'"+str(newname)+"\' WHERE slug=\'"+str(vaticname)+"\';"
			cursor2.execute(query)
			cnx.commit()
			cnx.close()

			#remove old symbolic link
			c="rm "+PublicDir+"/frames/"+vaticname
			os.popen(c,"r")
			#create new
			

			 
			
			ret+="Data was renamed in vatic\n"
		#reanme frames
		if os.path.isdir(VideoDataDir+"/"+vaticname):
			c="mv "+VideoDataDir+"/"+vaticname+" "+VideoDataDir+"/"+newname
			os.popen(c,"r")
			ret+="frames was renamed\n"
		#move old symbolic link
		c="ln -s "+VideoDataDir+"/"+newname+" "+PublicDir+"/frames/"+newname
		os.popen(c,"r")
		#create symbolik link
		c="sudo ln -s "+VideoDataDir+"/"+newname+" "+PublicDir+"/frames/"+newname
		os.popen(c,"r")
		#rename annotations
		if os.path.isfile(AnnotationDirFull+"/"+vaticname+".xml"):
			c="mv "+AnnotationDirFull+"/"+vaticname+".xml "+AnnotationDirFull+"/"+newname+".xml"
			os.popen(c,"r")
			ret+="Annotation was renamed\n"
		#rename video
		if os.path.isfile(VideoUploadDirFull+"/"+vaticname+".avi"):
			c="mv "+VideoUploadDirFull+"/"+vaticname+".avi  "+VideoUploadDirFull+"/"+newname+".avi"
			os.popen(c,"r")
			ret+="Uploaded video was renamed\n"
		#rename info txt
		#if os.path.isfile(VideoUploadDirFull+"/"+vaticname+".txt"):
		#	c="mv "+VideoUploadDirFull+"/"+vaticname+".txt  "+VideoUploadDirFull+"/"+newname+".txt"
		#	os.popen(c,"r")
		#	ret+="Info txt was renamed\n"
		#rename thumbnails
		if os.path.isdir(PublicDir+"/videothumbnails/"+vaticname):
			c="mv "+PublicDir+"/videothumbnails/"+vaticname+" "+PublicDir+"/videothumbnails/"+newname
			os.popen(c,"r")
			ret+="Thumbnail was renamed\n"
	return ret

@handler()
def delxml(vaticname,realname):
	ret=""
	#Delete original video from uploads dir
	if os.path.isfile(VideoUploadDirFull+"/"+realname+".avi"):
		c="rm "+VideoUploadDirFull+"/"+realname+".avi"
		os.popen(c,"r")
		ret+=""
	#Delete info txt from uploads dir
	if os.path.isfile(VideoUploadDirFull+"/"+realname+".txt"):
		c="rm "+VideoUploadDirFull+"/"+realname+".txt"
		os.popen(c,"r")

	#Delete annotation xml
	if os.path.isfile(AnnotationDirFull+"/"+realname+".xml"):
		c="rm "+AnnotationDirFull+"/"+realname+".xml"
		os.popen(c,"r")
	#Delete symbolic link
	if os.path.islink(PublicDir+"/frames/"+realname):
		c="rm "+PublicDir+"/frames/"+realname
		os.popen(c,"r")
	#Delete thumbnail
	if os.path.isdir(PublicDir+"/videothumbnails/"+realname):
		c="rm -rf "+PublicDir+"/videothumbnails/"+realname
		os.popen(c,"r")
	#connect to vatic database

	ExportCommand='cd '+HomeDir+'; turkic delete '+vaticname+' --force'
	os.popen(ExportCommand,"r")
	c="rm -rf "+VideoDataDir+"/"+vaticname
	os.popen(c,"r")	
	return "Video: "+realname+" was deleted successfully"


@handler()
def generatelistdel():
	ret="Delete Annotations:<br>"
	ret+=generateXML.GenerateXmlListDel()
	return ret

@handler()
def generatelist():
	ret= "<br>"
	ret+=generateXML.GenerateXmlList()
	return ret


@handler()
def dumpxml(vaticname,outname):
	return generateXML.DumpXml(vaticname,outname)

@handler()
def respawnjob(id):
    job = session.query(Job).get(id)

    replacement = job.markastraining()
    job.worker.verified = True
    session.add(job)
    session.add(replacement)
    session.commit()

    replacement.publish()
    session.add(replacement)
    session.commit()


@handler(type = "no", post = True, environ = True)
def uploadvideofile(command, postData, reqEnvironment):
	#Get file size
	fileLength = reqEnvironment.get('CONTENT_LENGTH', -1)
	if fileLength == -1:
		return "ERROR Occurred: Invalid file length received."
		
	try:
		VidName=str(uuid.uuid4())
		pickle.dump( postData, open( VideoUploadDirFull+"/"+VidName+".p", "wb" ), protocol=2 )
	except Exception, e:
    		return str("Hiba: ")+str(e)
	#!!!check if video with same name exist
	c=HomeDir+"/publisher.sh "+VidName+" &"	
	os.popen(c,"r")
	return "sikeres feltöltés, a videó néhány perc múlva megjelenik az adatbázisban"


@handler()
def uploadvideodrive(did,name,user,location,time,culture,devstate,comment):
	file = open(VideoUploadDirFull+"/"+did+".txt","w+") 
	file.write(name+"\n") 
	file.write(user+"\n") 
	file.write(location+"\n") 
	file.write(time+"\n") 	
	file.write(culture+"\n") 
	file.write(devstate+"\n") 
	file.write(comment+"\n") 
	
	file.close() 
	c=HomeDir+"/publisherdrive.sh "+did+" &"	
	os.popen(c,"r")
	return c
	return "az áttöltés elkezdődött, a videó néhány perc múlva megjelenik az adatbázisban"
	

@handler()
def getfreespace():
	c="df -h"	
	Response=os.popen(c,"r")
	for i in range(3):
		Response.readline()
	Line=Response.readline()
	Parts=Line.split()
	Cap=Parts[1]
	Used=Parts[2]
	Avail=Parts[3]
	Perc=Parts[4]
	RetString="<table border='1'>"
	RetString+="<tr><td>Hdd kapacitás: </td>"
	RetString+="<td>"+str(Cap)+"</td></tr>"
	RetString+="<tr><td>Használt terület: </td>"
	RetString+="<td>"+str(Used)+"</td></tr>"
	RetString+="<tr><td>Szabad terület: </td>"
	RetString+="<td>"+str(Avail)+"</td></tr>"
	RetString+="<tr><td>kihasználtság: </td>"
	RetString+="<td>"+str(Perc)+"</td></tr>"
	RetString+="</table>"
	return RetString



@handler()
def getvideodetails(id):
	ret="Részletek:<br><br>"
	#get data from info file
	VidName=""
	Uploader="-"
	Place=""
	Time=""
	LightCond=""
	Culture=""
	State=""
	Comment=""
	#get renamed name:
	Realname=id
	LinksCommand=os.popen('ls '+PublicDir +'/frames',"r")
	while True:		
		Link= LinksCommand.readline()
		if not Link:
			break
		Link=Link.strip()
		#check if we have in vatic where the link points
		command=os.popen('readlink -f '+PublicDir+'/frames/'+Link,"r")
		Points=(command.readline()).strip()
		Points=Points.split("/")[-1]
		if Points==id:
				Realname=Link
				Parts=Realname.split("_")
				VidName='_'.join(Parts[:-5])
				#Uploader=""
				Place=Parts[-5]
				Time=Parts[-4]
				LightCond=Parts[-3]
				Culture=Parts[-2]
				State=Parts[-1]
				Comment=""
	

	ret+="<br>Video neve: "+VidName
	ret+="<br>Feltöltő neve: "+Uploader
	ret+="<br>Helyszín: "+Place
	ret+="<br><br>Idő: "+Time
	ret+="<br><br>Féynviszonyok: "+LightCond
	ret+="<br><br>Kultúra: "+Culture
	ret+="<br><br>Fejlődési állapot: "+State
	ret+="<br><br>Megjegyzés: "+Comment
	
	ret+="<br><br>Szegmensek <b>"+str(id)+"</b> :"
	ret+=generateXML.GenerateLinkList(id,Realname)
	#ret+="<br><button type=\'button\' onClick=editinfo(\'"+Realname+"\') class=\'btn btn-primary\' data-dismiss=\'modal\' >Submit changes</button>"

	return ret
