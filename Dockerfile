# Use the official MongoDB image
FROM mongo:6.0

# Set environment variables
ENV MONGO_REPLICA_SET_NAME=rs0

# Create initialization script
COPY init-replica-set.js /docker-entrypoint-initdb.d/

# Copy startup script
COPY start-replica.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start-replica.sh

# Expose MongoDB port
EXPOSE 27017

# Use custom startup script
CMD ["/usr/local/bin/start-replica.sh"]
