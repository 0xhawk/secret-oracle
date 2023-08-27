
.PHONY: install
install: clean
	./scripts/install.sh

# .PHONY: init-local
# init-local: 
# 	./scripts/init_local_balance.sh

# .PHONY: test
# test: 
# 	./test/demo.sh
# 	./test/deposit.sh

.PHONY: clean
clean: 
	dfx stop
	rm -fr .dfx
