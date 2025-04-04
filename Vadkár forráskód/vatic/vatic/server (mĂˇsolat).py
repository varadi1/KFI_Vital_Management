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
import config

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
        result.append({"label": path.labelid,
                       "boxes": [tuple(x) for x in path.getboxes()],
                       "attributes": attrs})
    return result

def readpaths(tracks):
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

            logger.debug("Received box {0}".format(str(box.getbox())))

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
    job = session.query(Job).get(id)

    for path in job.paths:
        session.delete(path)
    session.commit()
    for path in readpaths(tracks):
        job.paths.append(path)

    session.add(job)
    session.commit()

@handler(post = "json")
def validatejob(id, tracks):
    job = session.query(Job).get(id)
    paths = readpaths(tracks)

    return job.trainingjob.validator(paths, job.trainingjob.paths)


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
		
	#Get Form header 
	f = open(VideoUploadDirFull+"/test.out", 'w')
	f.write(postData)
	f.close
	return "ok"

	#c=HomeDir+"/vatic_publisher.sh "+FileNameToUse+" "+filenameNoDot+" "+FullUploadPath+" "+VideoDataDir+" "+VaticObjects+" > "+HomeDir+"/log/VaticPublish_"+filenameNoDot+".log "+" 2> "+HomeDir+"/log/VaticPublish_"+filenameNoDot+"_err.log "+"&"
	#ret+=c
	#os.popen(c,"r")

	fHeader, remainData = postData.split("\r\n",1)
	#Remove the closing part of fHeader
	remainData = remainData.replace(fHeader+"--","")
		
	#Separate video data and other form data
	videoData, formData = remainData.split(fHeader,1)
	VideoName= (formData.split("videoname")[1]).split("\r\n")[2]
	VideoName=VideoName.replace(" ","_")
	VideoUploaderName= (formData.split("username")[1]).split("\r\n")[2]
	VideoUploaderName=VideoUploaderName.replace(" ","_")
	VideoLocation= (formData.split("location")[1]).split("\r\n")[2]
	VideoLocation=VideoLocation.replace(" ","_")
	VideoTime= (formData.split("time")[1]).split("\r\n")[2]
	VideoTime=VideoTime.replace(" ","_")
	VideoLightCondition= (formData.split("LightCondition")[1]).split("\r\n")[2]
	VideoLightCondition=VideoLightCondition.replace(" ","_")
	VideoCulture= (formData.split("Culture")[1]).split("\r\n")[2]
	VideoCulture=VideoCulture.replace(" ","_")
	VideoDevState= (formData.split("DevState")[1]).split("\r\n")[2]
	VideoDevState=VideoDevState.replace(" ","_")
	VideoComment= (formData.split("comment")[1]).split("\r\n")[2]
	VideoComment=VideoComment.replace(" ","_")
	
	VaticObjects="'Túrás ~Friss ~Régebbi Rágás ~Friss ~Régebbi Törés ~Friss ~Régebbi Taposás ~Friss ~Régebbi EgészségesNövény Egyéb1 Egyéb2 Egyéb3 Egyéb4 Egyéb5'"
	

	FileNameToUse=VideoUploadDirFull+"/"+VideoName+"_"+VideoLocation+"_"+VideoTime+"_"+VideoLightCondition+"_"+VideoCulture+"_"+VideoDevState+".avi"
	filenameNoDot=VideoName+"_"+VideoLocation+"_"+VideoTime+"_"+VideoLightCondition+"_"+VideoCulture+"_"+VideoDevState
	
	#Process video data
	contentData, ctype, remain = videoData.split("\r\n",2)
	#remain becomes null for some reason
	
	
	#Determine file name
	dispos, temp, fnamePart = contentData.split(";")
	
	temp, fileName = fnamePart.split("=")	
	fileName = fileName.replace("\"","")
	fileName = fileName.strip()

	
	#Clean file data
	toWrite = remain.strip()
	
	#Check uploaded file
	FullUploadPath = FileNameToUse
	
	if os.path.isfile(FullUploadPath):
		return "ERROR Occurred: A video with the same name already exists."
	
	#Save file
	f = open(FullUploadPath, 'w')
	f.write(toWrite)
	f.close
	
	

	ret = "Uploading video file: "+fileName+"\r\n"
	ret += "Uploaded file length: "+str(fileLength)+"\r\n"
	ret += FullUploadPath
	#filenameNoDot=fileName.split('.')[0:-1]
	#filenameNoDot=''.join(filenameNoDot)

	
	#start publishing in the background
	#c=HomeDir+"/vatic_publisher.sh "+FileNameToUse+" "+filenameNoDot+" "+FullUploadPath+" "+VideoDataDir+" "+VaticObjects+" > "+HomeDir+"/log/VaticPublish_"+filenameNoDot+".log "+" 2> "+HomeDir+"/log/VaticPublish_"+filenameNoDot+"_err.log "+"&"
	#ret+=c
	#os.popen(c,"r")

	#ret += "Processing started with name: "+str(FileNameToUse.split("/")[-1])+"\r\nIt can take up to 30 minutes for the video to appear in the database (depending on the video length).\r\n"


	return ret



@handler()
def getvideodetails(id):
	ret="Részletek:"
	#get data from info file
	LightCond="Ismeretlen"
	GPS="Ismeretlen"
	Description=""
	AllObject=0
	ObjectTypes=[]
	ObjectNums=[]
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
				LightCond="Unknown"
				GPS="Unknown"
				

	ret+="<br>Video neve:"+LightCond
	ret+="<br>Feltöltő neve:"+GPS
	ret+="<br>Helyszín:"+Description
	ret+="<br><br>Idő:"
	ret+="<br><br>Féynviszonyok:"
	ret+="<br><br>Kultúra:"
	ret+="<br><br>Fejlődési állapot:"
	ret+="<br>Bejelölt objektumok: "+str(AllObject)
	for ind in range(len(ObjectTypes)):
		ret+="<br>"+ObjectTypes[ind]+": "+str(ObjectNums[ind])
	ret+="<br><br>Annotation segments for <b>"+str(id)+"</b> :"
	ret+=generateXML.GenerateLinkList(id,Realname)
	ret+="<br><button type=\'button\' onClick=editinfo(\'"+Realname+"\') class=\'btn btn-primary\' data-dismiss=\'modal\' >Submit changes</button>"

	return ret
