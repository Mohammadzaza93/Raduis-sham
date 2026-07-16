# ÇÓÊÎÏÇã ÕæÑÉ ÃÓÇÓíÉ áÜ FreeRADIUS
FROM freeradius/freeradius-server:latest

# äÓÎ ãáİÇÊ ÇáÅÚÏÇÏÇÊ ÇáÎÇÕÉ Èß ãä ãÌáÏ radius ÇáãÍáí Åáì ÏÇÎá ÇáÍÇæíÉ
COPY ./config /etc/raddb

# ÊÚííä ÇáãäÇİĞ ÇáãØáæÈÉ ááÑÇÏíæÓ
EXPOSE 1812/udp 1813/udp

# ÃãÑ ÇáÊÔÛíá
CMD ["freeradius", "-X"]

# ÊİÚíá ÇáÜ SQL module
RUN ln -s /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/