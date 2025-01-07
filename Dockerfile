FROM alpine:latest 
CMD wget https://nrk.no | wget https://kabal.intern.dev.nav.no | wget https://kabal-frontend
