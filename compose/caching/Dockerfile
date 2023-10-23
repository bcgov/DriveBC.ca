FROM nginx:1.24


#COPY ./src/caching/nginx.conf /etc/nginx/nginx.conf
#Copy the template file to the nginx folder as well for testing
COPY ./src/caching/nginx.conf.template /etc/nginx/

RUN chmod -R 777 /var/cache/nginx
RUN chmod -R 777 /var/log/nginx
RUN chmod -R 775 /etc/nginx


CMD /usr/sbin/nginx -g 'daemon off;'

COPY ./compose/caching/entrypoint /
RUN sed -i 's/\r$//g' /entrypoint && chmod +x /entrypoint

ENTRYPOINT ["/entrypoint"]
