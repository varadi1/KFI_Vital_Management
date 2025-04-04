#!/bin/bash

set -x

filenameToUse="$1"

/usr/bin/python /home/horvathandras/vatic/vatic/publish.py $filenameToUse
