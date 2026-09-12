// src/js/modules/00-constants.js — split from app.js — do not edit header order
"use strict";
    const PROJECT_PROVENANCE = Object.freeze({
      product: "Bingkai Prisma",
      creator: "Fernanda Alvarez Pratama",
      creatorUrl: "https://github.com/fernanda-alvarez",
      repository: "https://github.com/fernanda-alvarez/bingkai-prisma",
      homepage: "https://bingkai-prisma.vercel.app"
    });

    const HEADER = ["data", "node", "box", "description", "boxtext", "tooltips", "url", "n"];
    const VIEWBOX_WIDTH = 2140;
    const VIEWBOX_HEIGHT = 1500;
    const PNG_SCALE = 3;
    const STAGE_BAND_X = 18;
    const STAGE_BAND_WIDTH = 70;
    const STAGE_LABEL_X = STAGE_BAND_X + STAGE_BAND_WIDTH / 2;

    // The initial values come from PRISMA_Editable.xlsx, while the CSV schema follows PRISMA.csv.
    const DEFAULT_CSV = `data,node,box,description,boxtext,tooltips,url,n
NA,node4,prevstud,Grey title box; Previous studies,Previous studies,Grey title box; Previous studies,prevstud.html,0
previous_studies,node5,box1,Studies included in previous version of review,Studies included in previous version of review,Studies included in previous version of review,previous_studies.html,0
previous_reports,NA,box1,Reports of studies included in previous version of review,Reports of studies included in previous version of review,NA,previous_reports.html,0
NA,node6,newstud,Yellow title box; Identification of new studies via databases and registers,Identification of new studies via databases and registers,Yellow title box; Identification of new studies via databases and registers,newstud.html,0
database_results,node7,box2,Records identified from: Databases,Databases,Records identified from: Databases and Registers,database_results.html,0
database_specific_results,NA,box2,Records identified from: specific databases,Specific Databases,NA,database_results.html,"Database 1, xxx; Database 2, xxx; Database 3, xxx"
register_results,NA,box2,Records identified from: Registers,Registers,NA,NA,0
register_specific_results,NA,box2,Records identified from: specific registers,Specific Registers,NA,database_results.html,"Register 1, xxx; Register 2, xxx; Register 3, xxx"
NA,node16,othstud,Grey title box; Identification of new studies via other methods,Identification of new studies via other methods,Grey title box; Identification of new studies via other methods,othstud.html,0
website_results,node17,box11,Records identified from: Websites,Websites,"Records identified from: Websites, Organisations and Citation Searching",website_results.html,0
organisation_results,,box11,Records identified from: Organisations,Organisations,NA,NA,0
citations_results,NA,box11,Records identified from: Citation searching,Citation searching,NA,NA,0
duplicates,node8,box3,Duplicate records,Duplicate records,Duplicate records,duplicates.html,0
excluded_automatic,NA,box3,Records marked as ineligible by automation tools,Records marked as ineligible by automation tools,NA,NA,0
excluded_other,NA,box3,Records removed for other reasons,Records removed for other reasons,NA,NA,0
records_screened,node9,box4,Records screened (databases and registers),Records screened,Records screened (databases and registers),records_screened.html,0
records_excluded,node10,box5,Records excluded (databases and registers),Records excluded,Records excluded (databases and registers),records_excluded.html,0
dbr_sought_reports,node11,box6,Reports sought for retrieval (databases and registers),Reports sought for retrieval,Reports sought for retrieval (databases and registers),dbr_sought_reports.html,0
dbr_notretrieved_reports,node12,box7,Reports not retrieved (databases and registers),Reports not retrieved,Reports not retrieved (databases and registers),dbr_notretrieved_reports.html,0
other_sought_reports,node18,box12,Reports sought for retrieval (other),Reports sought for retrieval,Reports sought for retrieval (other),other_sought_reports.html,0
other_notretrieved_reports,node19,box13,Reports not retrieved (other),Reports not retrieved,Reports not retrieved (other),other_notretrieved_reports.html,0
dbr_assessed,node13,box8,Reports assessed for eligibility (databases and registers),Reports assessed for eligibility,Reports assessed for eligibility (databases and registers),dbr_assessed.html,0
dbr_excluded,node14,box9,"Reports excluded (databases and registers): [separate reasons and numbers using ; e.g. Reason1, xxx; Reason2, xxx; Reason3, xxx]",Reports excluded,Reports excluded (databases and registers),dbrexcludedrecords.html,"Reason1, xxx; Reason2, xxx; Reason3, xxx"
other_assessed,node20,box14,Reports assessed for eligibility (other),Reports assessed for eligibility,Reports assessed for eligibility (other),other_assessed.html,0
other_excluded,node21,box15,"Reports excluded (other): [separate reasons and numbers using ; e.g. Reason1, xxx; Reason2, xxx; Reason3, xxx]",Reports excluded,Reports excluded (other),other_excluded.html,"Reason1, xxx; Reason2, xxx; Reason3, xxx"
new_studies,node15,box10,New studies included in review,New studies included in review,New studies included in review,new_studies.html,0
new_reports,NA,box10,Reports of new included studies,Reports of new included studies,NA,NA,0
total_studies,node22,box16,Total studies included in review,Total studies included in review,Total studies included in review,total_studies.html,0
total_reports,NA,box16,Reports of total included studies,Reports of total included studies,NA,NA,0
identification,node1,identification,Blue identification box,Identification,Blue identification box,identification.html,0
screening,node2,screening,Blue screening box,Screening,Blue screening box,screening.html,0
included,node3,included,Blue included box,Included,Blue included box,included.html,0
total_studies_ma,node23,box17,Total studies included in meta-analysis,Total studies included in meta-analysis,Total studies included in meta-analysis,total_studies_meta_analysis.html,0
total_reports_ma,NA,box17,Reports of total included studies in meta-analysis,Reports of total included studies in meta-analysis,NA,NA,0`;

    const FIELD_GROUPS = [
      {
        title: "Previous version",
        help: "The previous review arm is optional.",
        rows: [
          { id: "previous_studies", label: "Studies included", hint: "Previous version", type: "count" },
          { id: "previous_reports", label: "Reports included", hint: "Previous version", type: "count" }
        ]
      },
      {
        title: "Databases and registers",
        help: "Records identified through database and register searching.",
        rows: [
          { id: "database_results", label: "Records from databases", hint: "Total records", type: "count" },
          { id: "database_specific_results", label: "Specific databases", hint: "Example: PubMed, 53; Scopus, 94", type: "text" },
          { id: "register_results", label: "Records from registers", hint: "Total records", type: "count" },
          { id: "register_specific_results", label: "Specific registers", hint: "Optional source details", type: "text" }
        ]
      },
      {
        title: "Other methods",
        help: "Websites, organisations, and citation searching.",
        rows: [
          { id: "website_results", label: "Records from websites", hint: "Total records", type: "count" },
          { id: "organisation_results", label: "Records from organisations", hint: "Total records", type: "count" },
          { id: "citations_results", label: "Records from citation searching", hint: "Total records", type: "count" }
        ]
      },
      {
        title: "Screening",
        help: "Records removed and screened after identification.",
        rows: [
          { id: "duplicates", label: "Duplicate records", hint: "Removed before screening", type: "count" },
          { id: "excluded_automatic", label: "Ineligible by automation", hint: "Removed before screening", type: "count" },
          { id: "excluded_other", label: "Removed for other reasons", hint: "Removed before screening", type: "count" },
          { id: "records_screened", label: "Records screened", hint: "Databases and registers", type: "count" },
          { id: "records_excluded", label: "Records excluded", hint: "Databases and registers", type: "count" }
        ]
      },
      {
        title: "Reports and eligibility",
        help: "Retrieval and eligibility assessment for both arms.",
        rows: [
          { id: "dbr_sought_reports", label: "Reports sought", hint: "Databases and registers", type: "count" },
          { id: "dbr_notretrieved_reports", label: "Reports not retrieved", hint: "Databases and registers", type: "count" },
          { id: "dbr_assessed", label: "Reports assessed", hint: "Databases and registers", type: "count" },
          { id: "dbr_excluded", label: "Reports excluded", hint: "Use reasons separated by semicolons", type: "text" },
          { id: "other_sought_reports", label: "Reports sought", hint: "Other methods", type: "count" },
          { id: "other_notretrieved_reports", label: "Reports not retrieved", hint: "Other methods", type: "count" },
          { id: "other_assessed", label: "Reports assessed", hint: "Other methods", type: "count" },
          { id: "other_excluded", label: "Reports excluded", hint: "Use reasons separated by semicolons", type: "text" }
        ]
      },
      {
        title: "Included",
        help: "Studies and reports included in the review and meta-analysis.",
        rows: [
          { id: "new_studies", label: "New studies included", hint: "New studies", type: "count" },
          { id: "new_reports", label: "Reports of new studies", hint: "New reports", type: "count" },
          { id: "total_studies", label: "Total studies included", hint: "All included studies", type: "count" },
          { id: "total_reports", label: "Reports of total studies", hint: "All included reports", type: "count" },
          { id: "total_studies_ma", label: "Studies in meta-analysis", hint: "Meta-analysis", type: "count" },
          { id: "total_reports_ma", label: "Reports in meta-analysis", hint: "Meta-analysis", type: "count" }
        ]
      }
    ];
