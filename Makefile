SHELL := /bin/bash
.PHONY: help down
ARCH := $(shell uname -m)

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

up: ## Bring up containers
	@echo 'Starting containers...'
	@if [ "$(ARCH)" = "arm64" ]; then \
		docker-compose -f docker-compose.yml -f docker-compose.m1.yml up -d; \
	else \
		docker-compose up -d; \
	fi

down: ## Stop and remove containers and volumes
	@echo 'Removing containers and volumes...'
	docker-compose down -v
