import { css } from '@emotion/react';
import {IonButton, IonIcon, IonSpinner, useIonToast} from '@ionic/react';
import {useEffect, useState} from 'react';
import { useQueryClient } from 'react-query';
import { instance } from '../axios';
import { IWhitelist } from '../types/IWhitelist';
import isAxiosError from '../util/isAxiosError';
import TimeAgo from './TimeAgo';
import "./WhitelistCard.scss"
import ConfettiExplosion from 'react-confetti-explosion';
import { Grid } from '@material-ui/core';
import {logoTwitter} from 'ionicons/icons';

/**
 * The page they see when they are on /seamless, and browsing for whitelists etc..
 *
 * These are individual cards
 *
 * Parent is "WhitelistMarketplace.tsx"
 */

function WhitelistCard({
    image,
    max_users,
    twitter,
    sourceServer,
    targetServer,
    type,
    description,
	required_role_name,
	expiration_date,
	id,
	claimed,
	claimCounts,
    claims,
}: IWhitelist) {

	const [expired, setExpired] = useState<boolean | undefined>(undefined);
	const [claiming, setClaiming] = useState<boolean>(false);
	const queryClient = useQueryClient();
	const [present] = useIonToast();
	const full = claimCounts >= max_users;
    const [isExploding, setIsExploding] = useState<boolean>(false);
    const uid  = localStorage.getItem('uid');

    // what to show in each button
    const getButtonText = (
        expired : boolean,
        claiming : boolean,
        claimed : boolean, // undefined...
        full : boolean,
        claims:any,
        name: any) => {

        // if(name === 'Ready Set Trade'){
        //     console.log(expired, claiming, claimed, full , claims);
        //     console.log(claims[0]);
        //     console.log(uid);
        // }

        if(claimed){
            return "Claimed"
        }else if(expired){
            return "Already expired"
        }else if(full){
            return "Full"
        }else  if(claiming){
            return <IonSpinner />
        }else if(claims[0] && claims[0].user && uid){
            // these should always match, so just returning it here. Query is on whitelistRouter.js.getQueryOptions()
            if(claims[0].user.discordId === JSON.parse(uid)){
                return "Claimed"
            }else{
                return "Claimed"
            }
        }else {
            return "Obtain whitelist"
         }
    }

    // for confetti
    useEffect(() => {
        if(claimed) {
            setIsExploding(true);
        }
    },[]);

    return (
		<>

        <div className="border-gray-500 border-[0.5px] rounded-2xl w-80 overflow-clip">

            {/* for confetti */}
            {isExploding && expired !== undefined && <ConfettiExplosion />}

            <div className="relative overflow-y-hidden h-60 w-80">
                <img
                    src={image}
                    className="h-full w-full object-cover object-left"
                    alt={`${sourceServer?.name} X ${targetServer?.name}`}
                />
                <div className="absolute flex bottom-0 right-0 justify-between bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-50 py-2 px-5 left-0">
                    <div className="w-full">
                        <p className="text-lg font-bold">{sourceServer?.name}</p>
                        <p className="text-sm italic">must be in "{targetServer?.name}" DAO</p>
                        <p className="text-sm italic">
                            Type: Whitelist
                        </p>
                    </div>

                    {/*{discord && (*/}
                    {/*    <a*/}
                    {/*        href={discord}*/}
                    {/*        className="self-center hover:opacity-70"*/}
                    {/*        target="_blank"*/}
                    {/*    >*/}
                    {/*        <IonIcon icon={logoDiscord} className="h-5 w-5" />*/}
                    {/*    </a>*/}
                    {/*)}*/}

                    {twitter && (
                        <a
                            href={twitter}
                            className="self-center hover:opacity-70"
                            target="_blank"
                        >
                            <IonIcon icon={logoTwitter} className="h-5 w-5" />
                        </a>
                    )}
                </div>
            </div>

            <div
                className="py-4 px-6 flex-col flex"
            >

                <div className="mb-3">{description}</div>

                <div className="whitelistInfo grid grid-cols-2">
                    <p>Type </p>
                        <p>{type.toUpperCase()}</p>
                    <p>Slots left </p>
                        <p>{max_users - claimCounts}/{max_users}</p>
					<p>Required Role (in "{targetServer?.name}" DAO)</p>
					    <p>{required_role_name}</p>
					<p className="timeLeft">Time left</p>
					    <TimeAgo setExpired={setExpired} date={expiration_date}/>
                </div>

                {/* button! */}
				{expired !== undefined && <IonButton css={css`
					--background: linear-gradient(93.86deg, #6FDDA9 0%, #6276DF 100%);
				`} className="my-2 self-center"

                     // when you click the button!
                     onClick={async () => {
                        setClaiming(true);

                        try {

                            // submit form!
                            await instance.post("/whitelistClaims", {
                                whitelist_id : id
                            });
                            queryClient.setQueryData(
                                ['whitelistPartnerships'],
                                (queryData) => {
                                    return (queryData as IWhitelist[]).map(
                                        (whitelist) => {
                                            if (whitelist.id === id) {
                                                whitelist.claimed = true;
                                                whitelist.claimCounts += 1
                                            }
                                            return whitelist;
                                        }
                                    );
                                }
                            );

                            // success!

                            // setIsExploding(true);
                            present({
                                message:
                                    'Whitelist claimed successfully! You are now whitelisted in ' + sourceServer.name,
                                color: 'success',
                                duration: 10000,
                            });

                        // if error!
                        } catch (error) {
                            console.error(error);

                            if(isAxiosError(error) && error.response?.data){
                                present({
                                    message: error.response?.data.body,
                                    color: 'danger',
                                    duration: 5000,
                                });
                            }
                            else {
                                present({
                                    message: "Something went wrong",
                                    color: 'danger',
                                    duration: 5000,
                                });
                            }
                        } finally {
                            setClaiming(false);
                        }
                    }}

                     disabled={expired || claiming || claimed || full || getButtonText(expired,claiming,claimed, full, claims, sourceServer?.name) === 'Claimed'  }
                    >
                        {getButtonText(expired,claiming,claimed, full, claims, sourceServer?.name)}
                    </IonButton>

                }
                {/* end button! */}

				</div>

			</div>

		</>
    );
}

export default WhitelistCard;



{/*<div className="border-gray-500 border-[0.5px] rounded-2xl w-74 overflow-clip">*/}
{/*	{isExploding && <ConfettiExplosion />}*/}
{/*	<div className="relative overflow-y-hidden h-60 w-74">*/}
{/*		<img src={image} className="h-full w-full object-cover object-left" alt={`${sourceServer?.name} X ${targetServer?.name}`} />*/}
{/*		<div className="absolute flex bottom-0 right-0 justify-between bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-50 py-2 px-4 left-0">*/}
{/*			<div className="w-full">*/}
{/*                <p className="text-lg font-bold">{sourceServer?.name}</p>*/}
{/*                <p className="text-sm italic">requires membership in {targetServer?.name}</p>*/}
{/*                <p className="text-sm italic">*/}
{/*                    Type: Whitelist*/}
{/*                </p>*/}
{/*            </div>*/}
{/*		</div>*/}
{/*	</div>*/}

{/*	<div className="py-4 px-4 flex-col flex" >*/}
{/*		{description}*/}
{/*		<br/><br/>*/}
{/*		<div className="whitelistInfo grid grid-cols-2">*/}
{/*			<p>Type </p>*/}
{/*			<p>{type.toUpperCase()}</p>*/}
{/*			<p>Slots left </p>*/}
{/*			<p>{max_users - claimCounts}/{max_users}</p>*/}
{/*			<p>Required Role (in {targetServer.name})</p>*/}
{/*			<p>{required_role_name}</p>*/}
{/*			<p className="timeLeft">Time left</p>*/}
{/*			<TimeAgo setExpired={setExpired} date={expiration_date}/>*/}
{/*		</div>*/}

{/*		{expired !== undefined && <IonButton css={css` --background: linear-gradient(93.86deg, #6FDDA9 0%, #6276DF 100%); `} className="my-2 self-center" onClick={async () => {*/}
{/*			setClaiming(true);*/}
{/*			try {*/}
{/*				await instance.post("/createWhitelistClaims", { whitelist_id : id });*/}
{/*				queryClient.setQueryData( ['whitelistPartnerships'], (queryData:any) => {*/}
{/*						return (queryData as IWhitelist[]).map( (whitelist) => {*/}
{/*								if (whitelist.id === id) {*/}
{/*									whitelist.claimed = true;*/}
{/*									whitelist.claimCounts += 1*/}
{/*								}*/}
{/*								return whitelist;*/}
{/*							}*/}
{/*						);*/}
{/*					}*/}
{/*				);*/}

{/*				setIsExploding(true);*/}
