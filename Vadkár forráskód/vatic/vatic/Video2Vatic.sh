#!/bin/bash

FileType1="avi"
FileType2="mkv"

filename=$1
filenameToUse=$2
extension="${filename##*.}"
filename="${filename%.*}"
justfile=${filename##*/} 
logger -s -t $0 -p local7.err "$justfile"
logger -s -t $0 -p local7.err "$filename"

#check if there are input file
if [ "$#" -eq  "0" ]
then
	logger -s -t $0 -p local7.err "Usage: Input video not provided."
	logger -s -t $0 -p local7.err "Usage: Video2Vatic.sh videofile"
	exit
fi

#check if VideoStartLogo.png in directory
if [ -a VideoStartLogo.png ]
then
	echo
else
	logger -s -t $0 -p local7.err "VideoStartLogo.png not found. Please copy the file into the directory."
	echo
	exit
fi

logger -s -t $0 -p local7.err "Video input file: $1"

#Converting video input to desired format:
#Set resolution to 1280:720, set fps to 30, remove audio stream, set encoding h264
#Overlaying the video with the VideoStartLogo.png watermark, on top left corner for the first 30 frame
#ffmpeg-git-20150811-64bit-static/ffmpeg -i $1 -i VideoStartLogo.png -filter_complex "[0:v]scale=iw:ih[scaled]; [scaled][1:v]overlay=0:0:enable='between(t,0,1)'" -c:v libx264 -crf 15 -r 30 -an -y /tmp/$justfile.$extension
#ffmpeg-git-20150811-64bit-static/ffmpeg -r 30 -i $1 -i VideoStartLogo.png -filter_complex "[0:v]scale=iw:ih[scaled]; [scaled][1:v]overlay=0:0:enable='between(t,0,1)'" -c:v libx264 -crf 15 -r 30 -an -y /tmp/$justfile.$extension
#ffmpeg-git-20150811-64bit-static/ffmpeg -r 30 -i $1 -i VideoStartLogo.png -filter_complex "[0:v]scale=iw:ih[scaled]; [scaled][1:v]overlay=0:0:enable='between(t,0,1)'" -c:v libxvid -qscale:v 10 -r 30 -an -y /tmp/$justfile.$extension
#ffmpeg-git-20150811-64bit-static/ffmpeg -r 30 -i $1 -i VideoStartLogo.png -filter_complex "[0:v]scale=1280:720[scaled]; [scaled][1:v]overlay=0:0:enable='between(t,0,1)'" -c:v libx264 -threads 0 -bf 0 -profile:v high -preset fast -b-pyramid none -crf 18 -r 30 -an -sn -y /tmp/$justfile.$extension
ffmpeg -r 30 -i $1 -i VideoStartLogo.png -filter_complex "[0:v]scale=1280:720[scaled]; [scaled][1:v]overlay=0:0:enable='between(t,0,1)'" -c:v libx264 -threads 0 -bf 0 -profile:v high -preset fast -b-pyramid none -crf 18 -r 30 -an -sn -y /tmp/$justfile.$extension

cp /tmp/$justfile.$extension $filenameToUse
rm /tmp/$justfile.$extension
rm $filename
logger -s -t $0 -p local7.err "Video formatting is done. $filenameToUse video file created."
exit
