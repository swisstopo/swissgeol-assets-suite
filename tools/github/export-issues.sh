MAX_NUM=`gh issue list --repo Lambda-IT/asset-swissgeol-ch --limit 1 --json number \
    | jq ".[].number"`; for n in `seq 1 $MAX_NUM`; do gh issue view $n --repo Lambda-IT/asset-swissgeol-ch \
     --json assignees,author,body,closed,closedAt,comments,createdAt,id,labels,milestone,number,projectCards,reactionGroups,state,title,updatedAt,url >> github-dump.json; done
