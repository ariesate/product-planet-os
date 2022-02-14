br=`git branch | grep "*"`;
branch=`echo ${br/* /}`

git checkout dev
git pull
git checkout $branch
git merge dev
