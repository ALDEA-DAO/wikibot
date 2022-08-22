#!/bin/bash
source ./env

ASSETS=()

CleanUp () {
	#Limpiamos base de datos
	qCleanSlate="TRUNCATE TABLE snapshot RESTART IDENTITY;
				 TRUNCATE TABLE allowed RESTART IDENTITY;
				 TRUNCATE TABLE discarded RESTART IDENTITY;"
	psql --dbname "$MY_DB" -tc "$qCleanSlate";
}

GetHolders () {
# CONSULTAMOS ASSETS DE POLICY #1
ASSET_COUNT=1
i=0; while [ $ASSET_COUNT -gt ${tmpCOUNT:=0} ]; do 
	(( i++ ));
	tmpCOUNT=$ASSET_COUNT;
	ASSETS+=($(curl -s -H "project_id: $KEY" $APIUrl/assets/policy/$POLICY1/?page=$i | jq -r .[].asset)); 
	ASSET_COUNT=${#ASSETS[@]}
done
echo -e "ASSET COUNT FOR POLICY: $ASSET_COUNT \n" | tee -a $SnapLog

N=5
for j in "${ASSETS[@]}"; do
(	ADDRESS="" && STAKE="" && INFO="" && NAME="" && TYPE=""

	if [ $j != "" ]
		then
			INFO=$(curl -s -H "project_id: $KEY" $APIUrl/assets/$j)
			NAME=$(echo $INFO | jq -r .onchain_metadata.name)
			TYPE=$(echo $INFO | jq -r .onchain_metadata.token)
			ADDRESS=$(curl -s -H "project_id: $KEY" $APIUrl/assets/$j/addresses/ | jq -r .[].address)

# 108 carateres para testnet, 103 para mainnet			
			if [ ! -z "${ADDRESS}" ] && [[ $ADDRESS == addr* ]] && [[ ${#ADDRESS} -eq 103 ]]
			then 
				STAKE=($(curl -s -H "project_id: $KEY" $APIUrl/addresses/${ADDRESS}/ | jq -r .stake_address))
				qInsert="INSERT INTO snapshot(asset,name,type,payment,stake) VALUES ('$j','$NAME','$TYPE','$ADDRESS','$STAKE');"
			else
				qInsert="INSERT INTO snapshot(asset,name,type,payment,stake) VALUES ('$j','$NAME','$TYPE','$ADDRESS',NULL);"
			fi
# >>>>>>>>>>>COMMENTED FOR TESTING
			psql --dbname "$MY_DB" -tc "$qInsert" --quiet;
	echo -e "Saved info for $j:\n NAME: ${NAME} \n TYPE: ${TYPE} \n PAYMENT: $ADDRESS \n STAKE: $STAKE \n\n" | tee -a $SnapLog
	fi
) &
((i=i%N)); ((i++==0)) && wait
done
}


GetList () { 
	qGetList="SELECT id,name,type,payment FROM snapshot;"
	echo -e "Full list of assets and holders"
	psql --dbname "$MY_DB" -P pager=off -tc "$qGetList";
}

GetNull () {
	qGetNull="SELECT id,name,type,payment FROM snapshot WHERE stake IS NULL OR stake = '';"
	echo -e "Get Nulls"
	psql --dbname "$MY_DB" -P pager=off -tc "$qGetNull";
}

CleanNull () {
	qCleanNull="TRUNCATE TABLE discarded RESTART IDENTITY; INSERT INTO discarded(asset,name,type,payment) SELECT asset,name,type,payment FROM snapshot WHERE stake IS NULL OR stake = ''; DELETE FROM snapshot WHERE stake IS NULL OR stake = '';"
	psql --dbname "$MY_DB" -tc "$qCleanNull";
}

InsertAllowed () {
	qInsertAllowed="TRUNCATE TABLE allowed RESTART IDENTITY; 
		INSERT INTO allowed(stake,q,qGenesis,qGovernance) SELECT stake,
		sum(1 * CASE type
                     WHEN 'Genesis'  THEN 4860
                     WHEN 'Governance'   THEN 1193
                     END) AS Q,
		sum(CASE type
                     WHEN 'Genesis'  THEN 1
                     WHEN 'Governance'   THEN 0
                     END) AS qGenesis,
		sum(CASE type
                     WHEN 'Genesis'  THEN 0
                     WHEN 'Governance'   THEN 1
                     END) AS qGovernance
		FROM snapshot  WHERE stake IS NOT NULL OR stake <> '' GROUP  BY 1;"
	psql --dbname "$MY_DB" -tc "$qInsertAllowed";
}

GetCounts () {
	qGetAddresses="select COUNT(*) from snapshot;"
	t_Addresses=$(psql --dbname "$MY_DB" -tc "$qGetAddresses";)
	
	qGetAddressesDisc="select COUNT(*) from discarded;"
	t_Disc=$(psql --dbname "$MY_DB" -tc "$qGetAddressesDisc";)
	
	qGetAllowed="select COUNT(*) from allowed;"
	t_Allowed=$(psql --dbname "$MY_DB" -tc "$qGetAllowed";)
	
	sleep 1
	echo -e "\n\n\n*****************************************************************************"
	echo -e "TOTAL VALID ADDRESSESS FOR CLAIM: $t_Addresses | DISCARDED: $t_Disc" | tee -a $SnapLog
	echo -e "UNIQUE WALLETS ALLOWED | ALLOWED: $t_Allowed" | tee -a $SnapLog
}

SECONDS=0
echo -e "Started at $(date) \n" | tee -a $SnapLog

CleanUp 
GetHolders
GetList
GetNull
CleanNull
InsertAllowed
GetCounts

EndTime=$(date)
echo -e "Finished at $(date)" | tee -a $SnapLog

Duration=$SECONDS
echo -e "TOTAL SNAPSHOT DURATION: $(($Duration / 60)) minutes and $(($Duration % 60)) seconds" | tee -a $SnapLog