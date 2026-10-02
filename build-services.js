(() => {
  const language=()=>localStorage.getItem("aup-language")||"en";
  const copy={
    en:{
      eyebrow:"Build & property services",
      title:"From land to a finished property.",
      intro:"Architecture, construction, permit assistance, and property support can be coordinated in one service flow. Each project is reviewed based on its site, documents, scope, and budget.",
      architectTag:"Architecture & planning",architectTitle:"Architecture & design",architectText:"Plan the property from concept to a clearer build direction, including space planning, design coordination, and project preparation.",architectMeta:["Concept planning","Space planning","Design coordination"],architectCta:"Discuss architecture",
      contractorTag:"Construction",contractorTitle:"Contractor & construction",contractorText:"Coordinate the build process from prepared land to a completed property, with scope and execution adjusted to the agreed project requirements.",contractorMeta:["Villa & home","Kost & rental","Commercial"],contractorCta:"Discuss construction",
      permitTag:"Building compliance",permitTitle:"PBG & SLF assistance",permitText:"Support the administrative preparation for Persetujuan Bangunan Gedung and Sertifikat Laik Fungsi, including document coordination and the applicable submission process.",permitMeta:["PBG","SLF","Document coordination"],permitCta:"Ask about PBG & SLF",
      supportTag:"Integrated support",supportTitle:"Property project support",supportText:"Keep discovery, project preparation, permit coordination, and construction conversations connected in one property service ecosystem.",supportMeta:["Project coordination","Property support","One service flow"],supportCta:"Discuss my project",
      processTitle:"A clearer project journey.",processText:"The exact scope can vary by project, but the service flow can be presented in five simple stages.",steps:["Plan","Design","Permit","Build","Ready"],
      note:"Permit issuance and project outcomes depend on the property documents, technical requirements, applicable regulations, and the final agreed scope. This frontend is a concept preview only.",
      interests:{architect:"Architecture & Design",contractor:"Contractor & Construction",permit:"PBG & SLF Assistance",support:"Property Project Support"},
      messages:{architect:"Hello, I would like to discuss architecture and design services for my property project.",contractor:"Hello, I would like to discuss contractor and construction services for my property project.",permit:"Hello, I would like information about PBG and SLF assistance for my property.",support:"Hello, I would like to discuss integrated support for my property project."}
    },
    id:{
      eyebrow:"Layanan pembangunan & properti",
      title:"Dari tanah sampai properti siap digunakan.",
      intro:"Arsitektur, konstruksi, bantuan perizinan, dan dukungan properti dapat dikoordinasikan dalam satu alur layanan. Setiap proyek ditinjau berdasarkan lokasi, dokumen, ruang lingkup, dan anggaran.",
      architectTag:"Arsitektur & perencanaan",architectTitle:"Arsitektur & desain",architectText:"Rencanakan properti dari tahap konsep sampai arah pembangunan yang lebih jelas, termasuk tata ruang, koordinasi desain, dan persiapan proyek.",architectMeta:["Konsep bangunan","Tata ruang","Koordinasi desain"],architectCta:"Konsultasi arsitektur",
      contractorTag:"Konstruksi",contractorTitle:"Kontraktor & pembangunan",contractorText:"Koordinasikan proses pembangunan dari lahan yang sudah siap sampai properti selesai, dengan ruang lingkup pekerjaan mengikuti kebutuhan proyek yang disepakati.",contractorMeta:["Villa & rumah","Kos & rental","Komersial"],contractorCta:"Konsultasi pembangunan",
      permitTag:"Perizinan bangunan",permitTitle:"Pendampingan PBG & SLF",permitText:"Bantuan persiapan administrasi Persetujuan Bangunan Gedung dan Sertifikat Laik Fungsi, termasuk koordinasi dokumen serta proses pengajuan yang berlaku.",permitMeta:["PBG","SLF","Koordinasi dokumen"],permitCta:"Tanya PBG & SLF",
      supportTag:"Dukungan terintegrasi",supportTitle:"Pendampingan proyek properti",supportText:"Satukan pencarian properti, persiapan proyek, koordinasi perizinan, dan pembahasan pembangunan dalam satu ekosistem layanan properti.",supportMeta:["Koordinasi proyek","Dukungan properti","Satu alur layanan"],supportCta:"Konsultasikan proyek",
      processTitle:"Alur proyek yang lebih jelas.",processText:"Ruang lingkup setiap proyek bisa berbeda, tetapi alur layanan dapat dijelaskan melalui lima tahap sederhana.",steps:["Rencana","Desain","Perizinan","Bangun","Siap"],
      note:"Penerbitan izin dan hasil proyek bergantung pada dokumen properti, persyaratan teknis, peraturan yang berlaku, dan ruang lingkup final yang disepakati. Tampilan ini masih berupa pratinjau konsep frontend.",
      interests:{architect:"Arsitektur & Desain",contractor:"Kontraktor & Pembangunan",permit:"Pendampingan PBG & SLF",support:"Pendampingan Proyek Properti"},
      messages:{architect:"Halo, saya ingin berkonsultasi mengenai layanan arsitektur dan desain untuk proyek properti saya.",contractor:"Halo, saya ingin berkonsultasi mengenai jasa kontraktor dan pembangunan untuk proyek properti saya.",permit:"Halo, saya ingin informasi mengenai pendampingan PBG dan SLF untuk properti saya.",support:"Halo, saya ingin berkonsultasi mengenai pendampingan terintegrasi untuk proyek properti saya."}
    }
  };
  const t=()=>copy[language()]||copy.en;

  function ensureInterestOptions(){
    const select=document.querySelector('#contactForm select[name="interest"]');
    if(!select)return;
    const c=t();
    Object.entries(c.interests).forEach(([key,label])=>{
      let option=[...select.options].find(o=>o.dataset.buildService===key);
      if(!option){option=document.createElement("option");option.dataset.buildService=key;select.appendChild(option)}
      option.value=label;option.textContent=label;
    });
  }

  function fillInquiry(key){
    ensureInterestOptions();
    const c=t(),form=document.getElementById("contactForm");
    const select=form?.querySelector('select[name="interest"]');
    const message=form?.querySelector('textarea[name="message"]');
    if(select){const option=[...select.options].find(o=>o.dataset.buildService===key);if(option)select.value=option.value}
    if(message)message.value=c.messages[key]||"";
    document.getElementById("contact")?.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(()=>form?.querySelector('input[name="name"]')?.focus({preventScroll:true}),450);
  }

  function meta(items){return items.map(item=>`<span>${item}</span>`).join("")}

  function render(){
    const services=document.getElementById("services");if(!services)return;
    const c=t();
    let section=document.getElementById("permitService");
    if(!section){section=document.createElement("section");section.id="permitService";services.insertAdjacentElement("afterend",section)}
    section.className="build-services-section reveal-item";
    section.innerHTML=`
      <div class="build-services-shell">
        <div class="build-services-head">
          <div><p class="build-services-kicker">${c.eyebrow}</p><h2>${c.title}</h2></div>
          <div class="build-services-head-copy"><p>${c.intro}</p></div>
        </div>
        <div class="build-services-grid">
          <article class="build-service-card visual" style="--service-image:url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=86')">
            <span class="build-service-index">01</span><span class="build-service-tag">${c.architectTag}</span><h3>${c.architectTitle}</h3><p>${c.architectText}</p><div class="build-service-meta">${meta(c.architectMeta)}</div><button class="build-service-cta" type="button" data-build-inquiry="architect">${c.architectCta}</button>
          </article>
          <article class="build-service-card visual" style="--service-image:url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=86')">
            <span class="build-service-index">02</span><span class="build-service-tag">${c.contractorTag}</span><h3>${c.contractorTitle}</h3><p>${c.contractorText}</p><div class="build-service-meta">${meta(c.contractorMeta)}</div><button class="build-service-cta" type="button" data-build-inquiry="contractor">${c.contractorCta}</button>
          </article>
          <article class="build-service-card dark">
            <span class="build-service-index">03</span><span class="build-service-tag">${c.permitTag}</span><h3>${c.permitTitle}</h3><p>${c.permitText}</p><div class="build-service-meta">${meta(c.permitMeta)}</div><button class="build-service-cta" type="button" data-build-inquiry="permit">${c.permitCta}</button>
          </article>
          <article class="build-service-card soft">
            <span class="build-service-index">04</span><span class="build-service-tag">${c.supportTag}</span><h3>${c.supportTitle}</h3><p>${c.supportText}</p><div class="build-service-meta">${meta(c.supportMeta)}</div><button class="build-service-cta" type="button" data-build-inquiry="support">${c.supportCta}</button>
          </article>
        </div>
        <div class="build-service-process">
          <div class="build-service-process-top"><h3>${c.processTitle}</h3><p>${c.processText}</p></div>
          <div class="build-service-steps">${c.steps.map((step,i)=>`<div class="build-service-step"><small>0${i+1}</small><strong>${step}</strong></div>`).join("")}</div>
          <p class="build-service-note">${c.note}</p>
        </div>
      </div>`;
    section.querySelectorAll("[data-build-inquiry]").forEach(btn=>btn.addEventListener("click",()=>fillInquiry(btn.dataset.buildInquiry)));
    ensureInterestOptions();
    if(typeof observeReveals==="function")observeReveals(section);
  }

  render();
  document.getElementById("languageToggle")?.addEventListener("click",()=>setTimeout(render,0));
})();
