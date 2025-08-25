# Complete git summary
.PHONY: git-summary 
git-summary:
	@echo "=== GIT REPOSITORY SUMMARY ==="
	@echo "Repository: $(shell basename $(PWD))"
	@echo "Branch: $(shell git branch --show-current)"
	@echo ""
	@echo "📊 Statistics:"
	@echo "  Total commits: $(shell git log --oneline | wc -l)"
	@echo "  First commit: $(shell git log --pretty=format:'%ad' --date=short | tail -1)"
	@echo "  Latest commit: $(shell git log --pretty=format:'%ad' --date=short | head -1)"
	@echo "  Active days: $(shell git log --pretty=format:'%ad' --date=short | sort -u | wc -l)"
	@echo "  Time span: $(shell echo $$(( ($$(date -d "$$(git log --pretty=format:'%ad' --date=short | head -1)" +%s) - $$(date -d "$$(git log --pretty=format:'%ad' --date=short | tail -1)" +%s)) / 86400 ))) days"
	@echo "  Avg commits/day: $(shell echo "scale=1; $(shell git log --oneline | wc -l) / $(shell git log --pretty=format:'%ad' --date=short | sort -u | wc -l)" | bc)"
	@echo ""
	@echo "👥 Contributors:"
	@git shortlog -sn
	@echo ""
	@echo "📅 Recent Activity:"
	@git log --pretty=format:"  %h - %an, %ad: %s" --date=short -5
