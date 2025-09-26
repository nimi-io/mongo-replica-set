# Use the official MongoDB image
FROM mongo:6.0

# Set default environment variables
ENV MONGO_REPLICA_SET_NAME=rs0
ENV MONGO_PORT=27017
ENV MONGO_HOST=localhost
ENV MONGO_NODE_ID=0

# Create initialization script
COPY init-replica-set.js /docker-entrypoint-initdb.d/

# Expose MongoDB port  
EXPOSE 27017

# Create entrypoint script that uses environment variables
RUN echo '#!/bin/bash\n\
mongod --replSet ${MONGO_REPLICA_SET_NAME:-rs0} --bind_ip_all --port ${MONGO_PORT:-27017}' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Start MongoDB with replica set configuration
CMD ["/entrypoint.sh"]
