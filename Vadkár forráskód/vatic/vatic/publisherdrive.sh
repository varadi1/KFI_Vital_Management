#!/bin/bash

set -x



ggID="$1"


HomeDir="/home/horvathandras/vatic/vatic"
PublicDir="${HomeDir}/public"
VideoDataDir="/home/horvathandras/vatic/vatic/videos"


	
VideoUploadDirFull="/home/horvathandras/vatic/vatic/public/videouploads/"
 
ggURL='https://drive.google.com/uc?export=download'  
filename="$(curl -sc /tmp/gcokie "${ggURL}&id=${ggID}" | grep -o '="uc-name.*</span>' | sed 's/.*">//;s/<.a> .*//')"  
#filename="${ggURL}_${name}_${user}_${location}_${time}_${culture}_${devstate}"
#filename="${name}_${user}_${location}_${time}_${culture}_${devstate}_${comment}"
getcode="$(awk '/_warning_/ {print $NF}' /tmp/gcokie)" 
 

/usr/bin/curl -Lb /tmp/gcokie "${ggURL}&confirm=${getcode}&id=${ggID}" -o "${VideoUploadDirFull}${ggID}.avi"  


FullUploadPath="${VideoUploadDirFull}${ggID}.avi"


/home/horvathandras/vatic/vatic/vatic_publisher.sh "${FullUploadPath}" "${ggID}" "${FullUploadPath}" "${VideoDataDir}" "\"PozitívROI NegatívROI Túrás ~Friss ~Régebbi Rágás ~Friss ~Régebbi Törés ~Friss ~Régebbi Taposás ~Friss ~Régebbi EgészségesNövény Egyéb1 Egyéb2 Egyéb3 Egyéb4 Egyéb5\""  > "${HomeDir}/log/VaticPublish_${ggID}.log" "2>" "${HomeDir}/log/VaticPublish_${ggID}_err.log"
