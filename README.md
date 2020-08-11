# Interface for app.fulcrum.trade

To run this:

Run command "npm run start-mainnet"

If you need to install or re-install node_modules:
    - You should be in Sovryn/web/packages/fulcrum
    - Run "npm install"
    - Go into node_modules/@alch and delete the alchemy-web3 folder
    - Go back one directory to packages
    - Go into packages/alchemy-web3 and run npm install if no node_modules folder
    - Copy the packages/alchemy-web3 folder, and paste into packages/fulcrum/node_modules/@alch
    
If you add new dependencies, you won't have to do the alchemy-web3 copy and paste again.

Errors about the AlchemySubprovider mean that you need to manually copy and paste the alchemy-web3 folder across

The git repo for this is for the whole Sovryn directory. There is also an empty git repo in the fulcrum folder - you can ignore this.