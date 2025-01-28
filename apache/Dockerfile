FROM ubuntu:22.04

# Install Apache and required modules
RUN apt-get update && \
    apt-get install -y apache2 \
    apache2-utils \
    ssl-cert \
    && a2enmod proxy \
    && a2enmod proxy_http \
    && a2enmod proxy_balancer \
    && a2enmod ssl \
    && a2enmod headers \
    && a2enmod rewrite \
    && a2enmod remoteip \
    && rm -rf /var/lib/apt/lists/*

# Copy Apache configuration
COPY ./conf/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY ./conf/default-ssl.conf /etc/apache2/sites-available/default-ssl.conf
COPY ./conf/security.conf /etc/apache2/conf-available/security.conf

# Enable SSL site
RUN a2ensite default-ssl

# Create log directory
RUN mkdir -p /var/log/apache2

# Remove default index.html
RUN rm -f /var/www/html/index.html

# Expose ports
EXPOSE 80 443

# Start Apache in foreground
CMD ["apache2ctl", "-D", "FOREGROUND"]
