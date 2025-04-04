#!/bin/bash

set -x

filenameToUse="$1"
filenameNoDot="$2"
FullUploadPath="$3"
VideoDataDir="$4"
AvailableObjectTypes="$5"
cd "$(dirname "$0")"

touch $filenameToUse
chmod 744 $filenameToUse

#./Video2Vatic.sh $FullUploadPath $filenameToUse
#rm $FullUploadPath

mkdir /home/horvathandras/vatic/vatic/videos/$filenameNoDot

turkic extract $filenameToUse $VideoDataDir/$filenameNoDot --no-resize

turkic load $filenameNoDot $VideoDataDir/$filenameNoDot $AvailableObjectTypes --offline --title '$filenameNoDot Video' --length 1000 --description 'vatic annotation'

turkic publish --offline

mkdir /home/horvathandras/vatic/vatic/public/videothumbnails/$filenameNoDot
cp /home/horvathandras/vatic/vatic/videos/$filenameNoDot/0/0/31.jpg /home/horvathandras/vatic/vatic/public/videothumbnails/$filenameNoDot/thumb.jpg

