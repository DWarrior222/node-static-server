#!/bin/sh

cur_sec=`date '+%s'`
cur_ns=`date '+%N'`
cur_timestamp=$((`date '+%s'`*1000+`date '+%N'`/1000000))

docker image build -t luyuan221/static-server:$cur_timestamp .
docker login -u luyuan221 --password shuai2121
docker image push luyuan221/static-server:$cur_timestamp
echo 'build success'