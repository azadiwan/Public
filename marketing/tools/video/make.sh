#!/bin/bash
# Usage: make.sh script.json out.mp4
set -e; S=$1; O=$2; W=/tmp/vid/work-$(basename $S .json); rm -rf $W; mkdir -p $W
python3 $(dirname $0)/tts.py $S $W
node $(dirname $0)/rec.mjs $S $W
ls $W/l*.wav | sed "s#^#file '#;s#\$#'#" > $W/audio.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i $W/audio.txt -c:a pcm_s16le $W/voice.wav
ffmpeg -loglevel error -y -f concat -safe 0 -i $W/frames.txt -i $W/voice.wav -vf "scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 160k -shortest -movflags +faststart $O
ffprobe -v error -show_entries format=duration -of csv=p=0 $O
