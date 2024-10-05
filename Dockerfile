FROM node:22-alpine

# # Install app dependencies
RUN npm install

# Build the TypeScript code
RUN npm run build
RUN npm run demo-content

# Set the entrypoint to the command-line tool
ENTRYPOINT ["npm", start]
