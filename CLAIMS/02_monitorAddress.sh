#!/bin/bash
source ./env
checkError()
{
if [[ $1 -ne 0 ]]; then echo -e "\n\n\e[35mERROR (Code $1) !\e[0m\n"; exit 1; fi
}

convertToADA() {
echo $(bc <<< "scale=6; ${1} / 1000000" | sed -e 's/^\./0./') 
}

cli="/home/ubuntu/.local/bin/cardano-cli"
if [[ -f "first_block.txt" ]]; then firstBlockToCheck=$(cat first_block.txt); else firstBlockToCheck=; fi

if [[ -z $firstBlockToCheck ]]; then firstBlockToCheck=$($cli query tip --mainnet | jq -r .block); fi
echo -e "$(date +%F_%H:%M:%S) ==>> Starting transaction monitor" | tee -a $ClaimLog

checkWallet () {
TIP=$($cli query tip --mainnet | jq -r .block)
#echo "Latest Block Tip from Chain = ${TIP}" | tee -a $ClaimLog
if [[ ${firstBlockToCheck:=0} -ge $TIP ]]; then sleep 10; monitor; fi

mon=
utxoEntryCnt=0
i=0; while [ $i -eq 0 ] || [ $utxoEntryCnt -gt ${tmpCOUNT:=0} ]; do 
	(( i++ ));
	tmpCOUNT=$utxoEntryCnt;
	monTmp=$(curl -s -X GET "$APIUrl/addresses/$WALLET_MON/transactions?from=$firstBlockToCheck&page=$i" -H "project_id: $KEY"); checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi;
	mon=$(echo "$mon $monTmp" | jq -s add)
	ERRORmsg="The requested component has not been found."
	if [[ $mon == *"$ERRORmsg"* ]]; then echo "New wallet, no TXs"; else utxoEntryCnt=$(jq length <<< ${mon}); fi
done


echo -e "$(date +%F_%H:%M:%S) ==>> TX COUNT SINCE LAST CHECK: $utxoEntryCnt" | tee -a $ClaimLog

if [[ ${utxoEntryCnt} == 0 ]]; then 
	echo -e "$(date +%F_%H:%M:%S) ==>> NEXT TIME RESUME AT BLOCK: $firstBlockToCheck\n" | tee -a $ClaimLog
	echo $firstBlockToCheck > first_block.txt
	return
else
	for (( outIndexS=0; outIndexS<${utxoEntryCnt}; outIndexS++ ))
	do
		tx_hash=$(jq -r ".[${outIndexS}].tx_hash" <<< ${mon})
# CHEQUEEMOS ACA SI CLAIMEAMOS O PROCESAMOS DEVOLUCION
		if [ $(date +%s) -lt $endClaim ] ; then CheckClaimer; else
			if [ $(date +%s) -le $endReturn ] ; then doReturns; fi
		fi
		firstBlockToCheck=$(jq -r ".[${outIndexS}].block_height" <<< ${mon})
	done
	
	firstBlockToCheck=$(( $firstBlockToCheck + 1))
	echo -e "$(date +%F_%H:%M:%S) ==>> NEXT TIME RESUME AT BLOCK: $firstBlockToCheck\n" | tee -a $ClaimLog
	echo $firstBlockToCheck > first_block.txt
fi
}

CheckClaimer () {
# Consultamos ultimas transacciones de nuestra wallet monitoreada
tx_info=$(curl -s -X GET $APIUrl/txs/$tx_hash/utxos -H "project_id: $KEY")
echo -e "\n$(date +%F_%H:%M:%S) ==>> Analyzing TX ${tx_hash} in claiming mode" | tee -a $ClaimLog
outCount=$(jq '.outputs | length' <<< ${tx_info})

# En cada transacción nueva, verificamos si es válida para claim
for (( outIndex=0; outIndex<${outCount}; outIndex++ ))
do
	Qrequested=0
	Qclaiming=0
	Qallowed=0
	
	qTotalRequested="SELECT SUM(q) FROM claim_requests WHERE error=false;"
	TotalRequested=$(psql --dbname "$MY_DB" -tc "$qTotalRequested";)
	
	TXamount=$(jq -r ".outputs[${outIndex}]|select(.address==\"${WALLET_MON}\")|[.amount[0].quantity]" <<< ${tx_info} | tr -d []\ \") && TXamount=$(echo ${TXamount} | tr -d []\ \")
	TXsender=$(jq -r ".inputs[0]|[.address]" <<< ${tx_info}) && TXsender=$(echo ${TXsender} | tr -d []\ \")
	TXreceiver=$(jq -r ".outputs[${outIndex}]|[.address]" <<< ${tx_info}) && TXreceiver=$(echo ${TXreceiver} | tr -d []\ \")
	TXindex=$(jq -r ".outputs[${outIndex}]|[.output_index]" <<< ${tx_info}) && TXindex=$(echo ${TXindex} | tr -d []\ \")
	TX_UTXO="$tx_hash#$TXindex"

	if [[ ${TotalRequested:=0} -lt ${Stock} ]]; then
	# Solo nos sirven las TX donde recibimos fondos y no somos el Sender.	
		
		checkSender=$(jq -r ".inputs[]|[.address]" <<< ${tx_info})
		if [[ ${TXreceiver} != ${WALLET_MON} ]] || [[ ${TXsender} = ${WALLET_MON} ]] || [[ $checkSender == *"$WALLET_MON"* ]]; then echo -e "Non-Qualifying transaction"; fi	
		if [ ! -z "${TXamount}" ] && [[ ${TXreceiver} == ${WALLET_MON} ]] ; then 
			
			echo -e "$(convertToADA ${TXamount}) ADA received from $TXsender, processing..." | tee -a $ClaimLog
			
			#SI NO ENVIO SUFICIENTES ADA
			Qvalid=$(($TXamount / $Price1))
			if [[ ${Qvalid} -eq 0 ]] ; then 
				echo "Not enough ADA, processing refund" | tee -a $ClaimLog
				if [[ ${TXamount} -le ${MINTER_FEE} ]] ; then 
					changeAmt=0
					FEE=$TXamount
				else
					FEE=$MINTER_FEE
					changeAmt=$(($TXamount - $FEE))
				fi
				
				qReturn="INSERT INTO claim_requests (requester,valid,sent,q,returnamt,fee,utxo,error,processed) VALUES ('$TXsender',false,'$TXamount',0,'$changeAmt','$FEE','$TX_UTXO',false,false);"
				psql --dbname "$MY_DB" -tc "$qReturn";

			else #SI ENVIÓ LA CANTIDAD CORRECTA DE ADA
				changeAmt=$(($TXamount - $MINTER_FEE))
				
				# OBTENEMOS STAKE ADDRESS DEL SENDER
				Sender=($(curl -s -H "project_id: $KEY" $APIUrl/addresses/${TXsender}/ | jq -r .stake_address))
				
				# SI TIENE STAKE ADDRESS, VERIFICA SI ES HOLDER Y SI NO CLAIMEÓ AUN
				if [ ! -z "${Sender}" ] ; then 			
					qCheck="SELECT q FROM allowed WHERE stake = '$Sender' AND claimed IS FALSE;"
					Qallowed=$(psql --dbname "$MY_DB" -tc "$qCheck")
					echo -e "Sender Stake Address: $Sender  | Allowed: ${Qallowed:=0}" | tee -a $ClaimLog
				fi
				
				if [ -z "${Qallowed}" ] ; then Qallowed=0; echo "No rewards to claim allowed for address" | tee -a $ClaimLog; fi
				
				if [[ ${Qallowed} -eq 0 ]] ; then 
					valid="false"
					Qclaiming=$Qallowed
				else
				#SI VAMOS A PERMITIR CLAIM, VERIFICAMOS SI ALCANZA STOCK PARA ORDEN COMPLETA O PARCIAL
					if [[ $((${TotalRequested:=0} + $Qallowed)) -le ${Stock} ]]; then
						Qclaiming=$Qallowed
						echo "Stock remaining: $(($Stock - ($TotalRequested + $Qclaiming)))" | tee -a $ClaimLog
						echo -e "Buyer requested $Qallowed tokens" | tee -a $ClaimLog
					else
						Qclaiming=$(($Stock - $TotalRequested))
						Qallowed=$(($Qallowed - $Qclaiming))
						echo -e "Buyer requested $Qallowed tokens, sending $Qclaiming but our stock is now 0" | tee -a $ClaimLog
					fi
					valid="true"
					qUpdate="UPDATE allowed SET q = '$Qallowed', claimed = true WHERE stake = '$Sender'"
					psql --dbname "$MY_DB" -tc "$qUpdate";
					
					#VERIFICAMOS SI TENEMOS PAYMENT ADDR REGISTRADO EN SNAPSHOT
					qCheckOwner="SELECT COUNT(*) FROM snapshot WHERE payment = '$TXsender'"
					chkOwner=$(psql --dbname "$MY_DB" -tc "$qCheckOwner";)
					# Si la dirección coincide (Nami) envia directo. Si la dirección no es la misma del snapshot, buscamos su primera address 
					# y enviamos ahi para evitar exploit de FrankenAddresses
					if [[ $chkOwner -eq 0 ]] ; then 
						realOwner=$(curl -s -X GET $APIUrl/accounts/$Sender/addresses -H "project_id: $KEY" | jq -r '.[0].address')
						echo -e "Sending tokens to real owner: $realOwner" | tee -a $ClaimLog
						TXsender=$realOwner
					else
						echo -e "Sending tokens to sender address"
					fi	
				#Hasta aqui ejecutamos si tiene tokens disponibles
				fi
				
				echo "Reserving $Qclaiming token(s). Sending back $(convertToADA ${changeAmt}) \$ADA" | tee -a $ClaimLog
				qClaim="INSERT INTO claim_requests (requester,valid,sent,q,returnamt,fee,utxo,error,processed) VALUES ('$TXsender','$valid','$TXamount','$Qclaiming','$changeAmt','$MINTER_FEE','$TX_UTXO',false,false);"
				psql --dbname "$MY_DB" -tc "$qClaim";
			#Hasta aqui ejecutamos si alcanza para reclamar
			fi 
		#Hasta aqui ejecutamos si la TX era válida
		fi
	else #QUE PASA SI NO HAY MAS STOCK
		# Solo nos sirven las TX donde recibimos fondos.
		checkSender=$(jq -r ".inputs[]|[.address]" <<< ${tx_info})
		if [[ ${TXreceiver} != ${WALLET_MON} ]] || [[ ${TXsender} = ${WALLET_MON} ]] || [[ $checkSender == *"$WALLET_MON"* ]]; then echo -e "Non-Qualifying TX\n"; fi
		
		if [ ! -z "${TXamount}" ] && [[ ${TXreceiver} == ${WALLET_MON} ]] ; then 
			echo -e "$(convertToADA ${TXamount}) ADA received from $TXsender, but there's no stock left, processing refund..." | tee -a $ClaimLog
				
			qReturn="INSERT INTO claim_requests (requester,valid,sent,q,returnamt,fee,utxo,error,processed) VALUES ('$TXsender',false,'$TXamount',0,'$TXamount',0,'$TX_UTXO',false,false);"
			psql --dbname "$MY_DB" -tc "$qReturn"; 
		fi
	fi
done 
}

doReturns () {
# Consultamos ultimas transacciones de nuestra wallet monitoreada
tx_info=$(curl -s -X GET $APIUrl/txs/$tx_hash/utxos -H "project_id: $KEY")
echo -e "\n$(date +%F_%H:%M:%S) ==>> Analyzing TX ${tx_hash} in Return-only mode" | tee -a $ClaimLog
outCount=$(jq '.outputs | length' <<< ${tx_info})

# En cada transacción nueva, verificamos si es válida para minteo
for (( outIndex=0; outIndex<${outCount}; outIndex++ ))
do
	qCheckIfClaimed="SELECT SUM(q) FROM claim_requests WHERE error=false;"
	TotalRequested=$(psql --dbname "$MY_DB" -tc "$qCheckIfClaimed";)
	
	TXamount=$(jq -r ".outputs[${outIndex}]|select(.address==\"${WALLET_MON}\")|[.amount[0].quantity]" <<< ${tx_info} | tr -d []\ \") && TXamount=$(echo ${TXamount} | tr -d []\ \")
	TXsender=$(jq -r ".inputs[0]|[.address]" <<< ${tx_info}) && TXsender=$(echo ${TXsender} | tr -d []\ \")
	TXreceiver=$(jq -r ".outputs[${outIndex}]|[.address]" <<< ${tx_info}) && TXreceiver=$(echo ${TXreceiver} | tr -d []\ \")
	TXindex=$(jq -r ".outputs[${outIndex}]|[.output_index]" <<< ${tx_info}) && TXindex=$(echo ${TXindex} | tr -d []\ \")
	TX_UTXO="$tx_hash#$TXindex"

	# Solo nos sirven las TX donde recibimos fondos.
	if [[ ${TXreceiver} != ${WALLET_MON} ]] || [[ ${TXsender} = ${WALLET_MON} ]] || [[ $checkSender == *"$WALLET_MON"* ]]; then echo -e "Non-Qualifying TX\n"; break; fi	
	
	if [ ! -z "${TXamount}" ] && [[ ${TXreceiver} == ${WALLET_MON} ]] ; then 
		echo -e "$(convertToADA ${TXamount}) ADA received from $TXsender, but claiming period is over, processing refund..." | tee -a $ClaimLog
			
		qReturn="INSERT INTO claim_requests (requester,valid,sent,q,returnamt,fee,utxo,error,processed) VALUES ('$TXsender',false,'$TXamount',0,'$TXamount',0,'$TX_UTXO',false,false);"
		psql --dbname "$MY_DB" -tc "$qReturn"; 
	fi
done 
}

monitor () {
	while [ $(date +%s) -le $endReturn ]
	do
		checkWallet
		sleep 30
	done
}


#Cuanto dura el periodo de claim, en segundos (un dia = 86400) o epoch
endClaim=1663354800
#Cuanto tiempo seguimos procesando devoluciones
endReturn=$(( $endClaim + 86400 ))

echo -e "Claim period will run from $(date) until $(date -d @$endClaim)" | tee -a $ClaimLog
echo -e "We will process returns automatically until $(date -d @$endReturn)" | tee -a $ClaimLog

monitor
