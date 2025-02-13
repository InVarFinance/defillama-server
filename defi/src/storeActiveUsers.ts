import userAdapters from "../dimension-adapters/users/list";
import { wrapScheduledLambda } from "./utils/shared/wrap";
import { PromisePool } from '@supercharge/promise-pool'
import { shuffleArray } from "./utils/shared/shuffleArray";
import { storeUsers } from "./users/storeUsers";

async function storeActiveUsers() {
    await PromisePool
        .withConcurrency(16)
        .for(shuffleArray(userAdapters))
        .process(async ({ name, getUsers, id }) => {
            if(!id){
                console.log(`No id for ${name}, skipping...`) // No id to store
                return;
            }
            try {
                const end = Math.floor(Date.now() / 1e3)
                const start = end - 24 * 3600
                const users = await getUsers(start, end)
                await Promise.all(Object.entries(users).map(([chain, userNum]) => storeUsers(start, end, id, chain, Number((userNum as any).users))))
            } catch (e) {
                console.log(`Storing users for ${name} failed with error`, e)
            }
        })
}

export default wrapScheduledLambda(storeActiveUsers);
