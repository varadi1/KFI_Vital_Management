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


id=75
if True:
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
    query = "SELECT videoid FROM segments"
    cursor.execute(query)
    for rec in cursor:
	videoid=rec[0]
        print videoid
	
	addLabels=["TÃºrÃ¡s", "RÃ¡gÃ¡s", "TÃ¶rÃ©s", "TaposÃ¡s"]
	addattributes=["Friss", "1-2Hetes", "RÃ©gebbi", "EgyÃ©b1", "EgyÃ©b2", "EgyÃ©b3"] 
	for l in addLabels:
		l2=l.decode("utf8")
		cursor2 = cnx.cursor()
		query2 = "SELECT text,id FROM labels WHERE videoid=\'"+str(videoid)+"\'"
		cursor2.execute(query2)
		NotFound=True
		for rec2 in cursor2:
			line=rec2[0]
			if line==l2:
				print line			
				for a in addattributes:
					NotFound=True
					cursor3 = cnx.cursor()
					query3 = "SELECT text FROM attributes WHERE labelid=\'"+str(rec2[1])+"\'"
					cursor3.execute(query3)
					a2=a.decode("latin1")
					print a2
					for rec3 in cursor3:
						if rec3[0]==a2:
							NotFound=False
					print NotFound
					if NotFound:
						cursor4 = cnx.cursor()
						query4 = "INSERT INTO attributes (text,labelid) VALUES (\'"+a+"\',\'"+str(rec2[1])+"\');"
						cursor4.execute(query4)
						cnx.commit()
					cursor3.close()
		cursor2.close()
		
     	
    cursor.close()
    cnx.close()
