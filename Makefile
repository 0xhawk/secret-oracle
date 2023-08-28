
.PHONY: install
install: clean
	./scripts/install.sh

.PHONY: clean
clean: 
	dfx stop
	rm -fr .dfx
