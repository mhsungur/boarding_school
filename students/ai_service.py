import time
import random

def generate_student_report(summary_data):
    """
    Simulates an AI call to generate a student report based on the summary data.
    In the future, this will call the Google Gemini API.
    """
    
    # Simulate network latency
    time.sleep(1.5)
    
    student_name = summary_data['student_name']
    bed_rate = summary_data['bed_stats']['tidy_rate']
    prayer_rate = summary_data['prayer_stats']['attendance_rate']
    
    # Mock response logic based on data
    report = f"## 📝 {student_name} İçin Haftalık Gelişim Raporu\n\n"
    
    report += "**Genel Değerlendirme:**\n"
    if bed_rate > 80 and prayer_rate > 80:
        report += f"{student_name}, bu hafta hem disiplin hem de manevi gelişim açısından örnek bir performans sergiledi. Yatak düzeni ve namaz takibi konusundaki hassasiyeti takdire şayan.\n\n"
    elif bed_rate < 50:
        report += f"{student_name} genel olarak iyi bir hafta geçirse de, yatak düzeni konusunda biraz daha özenli olması gerekiyor. Düzenli bir ortam, düzenli bir zihin demektir.\n\n"
    else:
        report += f"{student_name} bu hafta dengeli bir performans gösterdi. Ufak tefek eksiklikler olsa da genel gidişat olumlu.\n\n"
        
    report += "**Güçlü Yönler:**\n"
    report += "- 🛏️ Yatak düzeni konusunda istikrarlı.\n"
    report += "- 🤝 Arkadaşlarıyla ilişkileri olumlu (Gözlem).\n\n"
    
    report += "**Gelişim Alanları:**\n"
    report += "- 📚 Etüt saatlerinde odaklanma süresini artırabilir.\n"
    report += "- ⏰ Sabah namazlarına katılımda süreklilik sağlanmalı.\n\n"
    
    report += "**Mentor Notu:**\n"
    report += "\"Başarı bir yolculuktur, bir varış noktası değil. Gayretini takdir ediyorum!\""
    
    return report
