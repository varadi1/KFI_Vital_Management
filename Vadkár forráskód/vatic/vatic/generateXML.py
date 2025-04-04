#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import os.path
import shutil
import paramiko
import httplib
import mysql.connector
import config
import xml.etree.cElementTree as XmlTree
from pathconfig import *



def GenerateXmlList():
	# get annotation list
	command=os.popen('cd '+HomeDir+'; turkic list',"r")
	LinksCommand=os.popen('ls '+PublicDir +'/frames',"r")
	VaticLines=[]
	while True:
		line= command.readline()
		if not line:
			break
		line=line.strip()
		VaticLines.append(line)
	
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
	

	ret=''
	ret=ret+'<table border=\"1\" class=\"order-table table\">'
	ret=ret+'<tr><th>Video név</th><th>Thumbnail</th><th>Video</th><th>Annotáció</th><th>Objektum szám</th><th>Objektum Típusok</th><th>Megjegyzés</th></tr>'
	# parse annotation list
	
	while True:		
		Link= LinksCommand.readline()
		if not Link:
			break
		Link=Link.strip()
		#check if we have in vatic where the link points
		command=os.popen('readlink -f '+PublicDir+'/frames/'+Link,"r")
		Points=(command.readline()).strip()
		Points=Points.split("/")[-1]
		line=""
		for V in VaticLines:
			if Points==V:
				AllObject=0
				ObjectTypes=[]
				ObjectNums=[]
				line=V
				try:
					if os.path.isfile(AnnotationDirFull +"/"+Link+".xml"):					
							Tree=XmlTree.parse(AnnotationDirFull+"/"+Link+".xml")
							Root=Tree.getroot()
							Objects=Root.findall("./track")
							AllObject=Root.attrib['count']									
							for Obj in Objects:
								label=Obj.attrib['label']
								try:
									Index=ObjectTypes.index(label)
									ObjectNums[Index]+=1
								except:
									ObjectTypes.append(label)
									ObjectNums.append(1)
					else:
							ExportCommand='cd '+HomeDir+'; turkic dump '+line+' -o '+AnnotationDirFull+'/'+Link+'.xml --xml --merge --merge-threshold 0.5'
			    				os.popen(ExportCommand,"r")
							Tree=XmlTree.parse(AnnotationDirFull+"/"+Link+".xml")
							Root=Tree.getroot()
							Objects=Root.findall("./track")
							AllObject=Root.attrib['count']
							for Obj in Objects:
								label=Obj.attrib['label']
								try:
									Index=ObjectTypes.index(label)
									ObjectNums[Index]+=1
								except:
									ObjectTypes.append(label)
									ObjectNums.append(1)	
				except:
					pass 
				#Check video and zipfile link
				VideoText="Get Video"
				Videolink='\'videouploads/'+str(Link)+'.avi\''
				#create buttons
				StrObjTypes=''
				for ind in range(len(ObjectTypes)):
					StrObjTypes+=ObjectTypes[ind].encode('utf-8')+": "+str(ObjectNums[ind])+"; "
				
				#create buttons
				ret+='<tr><td><a href=\"/details.html?video='+str(line)+'\">'+str(Link)+'</td><td><a href=\'videothumbnails/'+str(Link)+'/thumb.jpg\'><img src=\'videothumbnails/'+str(Link)+'/thumb.jpg\' alt=\'thumbnail\' height=\'40\' width=\'80\'></a><td><button onclick=\"location.href='+Videolink+'\">'+VideoText+'</button></td></td><td><button type=\'button\' onClick=ExportAnnotationClicked(\''+str(line)+'\',\''+str(Link)+'\') class=\'btn btn-primary\' data-dismiss=\'modal\' >Get Annotation</button></td><td>'+str(AllObject)+'</td><td>'+StrObjTypes+'</td><td>'+"comment"+'</td></tr>'

	ret+='</table>'
	cnx.close()
	return ret

def CheckVideoFormat(name):
	if name.endswith('.avi') or  name.endswith('.wmv'):
		return 1
	else:
		return 0


def GenerateXmlListDel():
	# get annotation list
	command=os.popen('cd '+HomeDir+'; turkic list',"r")
	LinksCommand=os.popen('ls '+PublicDir +'/frames',"r")
	VaticLines=[]
	while True:
		line= command.readline()
		if not line:
			break
		line=line.strip()
		VaticLines.append(line)
	
	ret=''
	# parse annotation list
	while True:		
		Link= LinksCommand.readline()
		if not Link:
			break
		Link=Link.strip()
		#check if we have in vatic where the link points
		command=os.popen('readlink -f '+PublicDir+'/frames/'+Link,"r")
		Points=(command.readline()).strip()
		Points=Points.split("/")[-1]
		line=""
		for V in VaticLines:
			if Points==V:
				line=V
				#create buttons		
				ret=ret+'<br>Annotation: '+Link+'<button type=\'button\' onClick=BtnClicked(\''+str(line)+'\',\''+str(Link)+'\') class=\'btn btn-primary\' data-dismiss=\'modal\' >Delete</button><br>'
	return ret

def GenerateDirList(dir,level,ftp):
    #list directory
    fileList = ftp.listdir(path=dir)
    
    ret=''   
    # parse annotation list
    for file in fileList:
	if CheckVideoFormat(file ):
	  VideoPath=dir+'/'+str(file) 
	  okformat=VideoPath.replace("/","!")
	  ret+="<div style='text-indent: "+str(level*3)+"em;'>Video:"+file+'<button type=\'button\' onClick=BtnClicked(\''+str(okformat)+'\') class=\'btn btn-primary\' data-dismiss=\'modal\' >Upload </button></div>'
	elif file.find(".") == -1:
	  ret+="<div style='text-indent: "+str(level*3)+"em;'>Dir: "+file+"</div>"
         #directory call
	  ret+=GenerateDirList(dir+'/'+file,level+1,ftp)
	else:
	  ret+="<div style='text-indent: "+str(level*3)+"em;'>File: "+file+"</div>"		
    return ret


def GenerateLinkList(id,realname):
	# get annotation list
	c="cd "+HomeDir+"; turkic find --id "+id
	command=os.popen(c,"r")
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

	ret="<table border=\"1\">"
	ret+="<tr><th>Szegmens</th><th>Thumbnail</th><th>Objektum szám</th><th>Objectum típusok</th></tr>"
	
	Segmentindex=0
	while True:
		LabelNums=[]
		ObjectLabels=[]
		line= command.readline()
		if not line:
			break
		line=line.strip()
		line=line.replace(ServerIPAddr,ServerName)
		segmentid=line.split("?id=")
		segmentid=segmentid[1].split("&hit")
		ObjectsInVideo=0
		

		cursor3 = cnx.cursor()
		query3 = "SELECT id, labelid FROM paths WHERE jobid=\'"+str(segmentid[0])+"\'"
		cursor3.execute(query3)

		for rec3 in cursor3:
			ObjectsInVideo+=1
			cursor4 = cnx.cursor()
			query4 = "SELECT text FROM labels WHERE id=\'"+str(rec3[1])+"\'"
			cursor4.execute(query4)
			for rec4 in cursor4:
				LabelIndex=0
				Found=False
				for l in ObjectLabels:
					if rec4[0]==l:
						LabelNums[LabelIndex]+=1
						Found=True
					LabelIndex+=1
				if not Found:
					LabelNums.append(1)
					ObjectLabels.append(rec4[0])
			cursor4.close()
		cursor3.close()

		StrObjTypes=''
		for ind in range(len(ObjectLabels)):
			StrObjTypes+=str(ObjectLabels[ind].encode('utf-8'))+": "+str(LabelNums[ind])+"; "
		
		OuterDir=int(Segmentindex)/int(10000)
		InnerDir=int(Segmentindex)/int(100)
		ImgLink=VideoDataDir+"/"+str(id)+"/"+str(OuterDir)+"/"+str(InnerDir)+"/"+str(Segmentindex)+".jpg"
		PubLink="./videothumbnails/"+str(realname)+"/"+"thumb.jpg"
		ImgPubLink=PublicDir+"/videothumbnails/"+str(realname)+"/"+"thumb.jpg"
		if not os.path.isfile(ImgPubLink):
			c="cp "+ImgLink+" "+ImgPubLink
			os.popen(c,"r")
		line=line.replace("localhost","vadkar.v-m.hu")
		Thumbnail="<a href=\'"+str(PubLink)+"\'><img src=\'"+str(PubLink)+"\' alt=\'thumbnail\' height=\'40\' width=\'80\'></a>"
		ret+="<tr><td><a href=\""+line+"\">"+line+"</a></td><td>"+Thumbnail+"</td><td> "+str(ObjectsInVideo)+"</td><td>"+StrObjTypes+"</td></tr>"
		Segmentindex+=1000
	cnx.close()
	ret+="</table>"
	return ret




def DumpXml(vaticname,outname):
    #dump annotation
    ExportCommand='cd '+HomeDir+'; turkic dump '+vaticname+' -o '+AnnotationDirFull+'/'+outname+'.xml --xml --merge --merge-threshold 0.5'
    os.popen(ExportCommand,"r")
    
    return "/"+AnnotationDir+"/"+outname+".xml"
