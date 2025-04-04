#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import pickle
import sys
import config
from ownconfig import *

print sys.argv
postData = pickle.load( open( VideoUploadDirFull+"/"+str(sys.argv[1])+".p", "rb" ) )

fHeader, postData = postData.split("\r\n",1)
postData = postData.replace(fHeader+"--","")

#Separate video data and other form data
videoData, formData = postData.split(fHeader,1)
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

FileNameToUse=VideoUploadDirFull+"/"+VideoName+"_"+VideoLocation+"_"+VideoTime+"_"+VideoLightCondition+"_"+VideoCulture+"_"+VideoDevState+".avi"
filenameNoDot=VideoName+"_"+VideoLocation+"_"+VideoTime+"_"+VideoLightCondition+"_"+VideoCulture+"_"+VideoDevState
	
VaticObjects="'PozitívROI NegatívROI Túrás ~Friss ~1-2Hetes ~Régebbi ~Egyéb1 ~Egyéb2 ~Egyéb3 Rágás ~Friss ~1-2Hetes ~Régebbi ~Egyéb1 ~Egyéb2 ~Egyéb3 Törés ~Friss ~1-2Hetes ~Régebbi ~Egyéb1 ~Egyéb2 ~Egyéb3 Taposás ~Friss ~1-2Hetes ~Régebbi ~Egyéb1 ~Egyéb2 ~Egyéb3 EgészségesNövény Egyéb1 Egyéb2 Egyéb3 Egyéb4 Egyéb5 Bizonytalan Művelőút Gktaposás Vetőhiba Széldöntés Jégkár Belvíz Aszály Erózió EgyszikűGyom KétszikűGyom EgyébNövvédelmiPR'"
	

#clear variables
postData=None
formData=None

#Process video data
contentData, ctype, videoData = videoData.split("\r\n",2)
#remain becomes null for some reason


#Clean file data
videoData = videoData.strip()
#Save file
f = open(VideoUploadDirFull+"/"+filenameNoDot+'.avi', 'w')
f.write(videoData)
f.close

	
	
#filenameNoDot=fileName.split('.')[0:-1]
#filenameNoDot=''.join(filenameNoDot)
FullUploadPath = VideoUploadDirFull+"/"+filenameNoDot+'.avi'
	
#start publishing in the background
c=HomeDir+"/vatic_publisher.sh "+FullUploadPath+" "+filenameNoDot+" "+FullUploadPath+" "+VideoDataDir+" "+VaticObjects+" > "+HomeDir+"/log/VaticPublish_"+filenameNoDot+".log "+" 2> "+HomeDir+"/log/VaticPublish_"+filenameNoDot+"_err.log "+"&"
os.popen(c,"r")

#ret += "Processing started with name: "+str(FileNameToUse.split("/")[-1])+"\r\nIt can take up to 30 minutes for the video to appear in the database (depending on the video length).\r\n"
#!!!remove the pickle file


